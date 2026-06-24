import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { buildMemberDuplicateFingerprint, validateMemberProfileInput } from '@/lib/memberProfile';
import { getZodErrorMessage, signUpRequestSchema } from '@/lib/authSchemas';
import { sendEmailVerificationMail } from '@/lib/emailVerification';
import { syncParticipantForMemberProfile } from '@/lib/participantSync';
import { hashMemberInvitationToken } from '@/lib/memberInvitation';

export async function POST(request: NextRequest) {
  const parsed = signUpRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: getZodErrorMessage(parsed.error) }, { status: 400 });
  }
  const body = parsed.data;

  const invitation = await prisma.memberInvitationToken.findUnique({
    where: { tokenHash: hashMemberInvitationToken(body.invitationToken) },
  });
  if (!invitation || invitation.usedAt || invitation.expiresAt <= new Date() || invitation.email !== body.email) {
    return NextResponse.json({ error: '招待リンクが無効、期限切れ、またはメールアドレスが一致しません。' }, { status: 403 });
  }

  const profileValidation = validateMemberProfileInput(body, {
    requireDisplayName: true,
    requireRequiredSelections: true,
  });
  if ('error' in profileValidation) {
    return NextResponse.json({ error: profileValidation.error }, { status: 400 });
  }
  const profileData = profileValidation.data;

  const existing = await prisma.userAccount.findUnique({ where: { email: body.email } });
  if (existing) {
    if (!existing.emailVerifiedAt) {
      const verification = await sendEmailVerificationMail(existing.id, existing.email);
      return NextResponse.json({
        ok: true,
        message: 'Verification mail re-sent.',
        ...(process.env.NODE_ENV !== 'production' ? { verificationToken: verification.token, expiresAt: verification.expiresAt } : {}),
      });
    }

    return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
  }

  const duplicateFingerprint = buildMemberDuplicateFingerprint({
    displayName: body.displayName,
    mainInstrument: profileData.mainInstrument,
    area: profileData.area,
    gender: profileData.gender,
    ageRange: profileData.ageRange,
  });

  const duplicateMembers = await prisma.memberProfile.findMany({
    where: {
      mainInstrument: profileData.mainInstrument,
      area: profileData.area,
      gender: profileData.gender,
      ageRange: profileData.ageRange,
    },
    include: {
      userAccount: {
        select: {
          id: true,
          email: true,
          emailVerifiedAt: true,
          status: true,
        },
      },
    },
  });

  const duplicateMember = duplicateMembers.find((member) =>
    buildMemberDuplicateFingerprint({
      displayName: member.displayName,
      mainInstrument: member.mainInstrument,
      area: member.area,
      gender: member.gender,
      ageRange: member.ageRange,
    }) === duplicateFingerprint,
  );

  if (duplicateMember) {
    return NextResponse.json({
      error: duplicateMember.userAccount.emailVerifiedAt
        ? '同じプロフィール情報のメンバーが既に登録されています。登録済みメールアドレスをご確認ください。'
        : '同じプロフィール情報の仮登録が既にあります。登録済みメールアドレスをご確認ください。',
    }, { status: 409 });
  }

  const passwordHash = await hashPassword(body.password);
  const user = await prisma.$transaction(async (tx) => {
    const consumedInvitation = await tx.memberInvitationToken.updateMany({
      where: { id: invitation.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (consumedInvitation.count !== 1) throw new Error('招待リンクは既に使用済みまたは期限切れです。');
    const createdUser = await tx.userAccount.create({
      data: {
        email: body.email,
        passwordHash,
        role: 'member',
        status: 'active',
        emailVerifiedAt: null,
        memberProfile: {
          create: {
            displayName: body.displayName,
            mainInstrument: profileData.mainInstrument!,
            subInstrument: profileData.subInstrument ?? null,
            gender: profileData.gender!,
            ageRange: profileData.ageRange!,
            area: profileData.area!,
            nickname: null,
            bio: null,
          },
        },
      },
      include: { memberProfile: true },
    });
    if (!createdUser.memberProfile) {
      throw new Error('member profile was not created');
    }

    await syncParticipantForMemberProfile(tx, {
      nextDisplayName: createdUser.memberProfile.displayName,
      nextMainInstrument: createdUser.memberProfile.mainInstrument,
    });

    return createdUser;
  });

  const verification = await sendEmailVerificationMail(user.id, user.email);

  return NextResponse.json({
    ok: true,
    message: 'Verification mail sent.',
    ...(process.env.NODE_ENV !== 'production' ? { verificationToken: verification.token, expiresAt: verification.expiresAt } : {}),
  }, { status: 201 });
}
