import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SectionProps } from './types';

export function Section({ title, description, children, action, className, contentClassName }: SectionProps) {
  return (
    <section className="mt-6">
      <Card className={cn('border shadow-sm', className)}>
        <CardHeader className="border-b bg-muted/30">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
          {action ? <CardAction>{action}</CardAction> : null}
        </CardHeader>
        <CardContent className={cn('pt-4', contentClassName)}>{children}</CardContent>
      </Card>
    </section>
  );
}
