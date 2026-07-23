import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import type { SectionProps } from './types';

export function Section({
  title,
  description,
  children,
  action,
  collapsible = false,
  defaultOpen = false,
  sectionId,
  className,
  contentClassName,
}: SectionProps) {
  if (collapsible) {
    return (
      <section id={sectionId} className="mt-6 scroll-mt-24">
        <Card className={cn('border shadow-sm bg-gray-100 text-on-background', className)}>
          <details className="group" open={defaultOpen || undefined}>
            <summary className="cursor-pointer list-none">
              <CardHeader className="bg-muted/30 transition-colors hover:bg-muted/50">
                <CardTitle>{title}</CardTitle>
                {description ? <CardDescription>{description}</CardDescription> : null}
                <CardAction className="flex items-center gap-2">
                  {action}
                  <ChevronDown className="size-5 text-muted-foreground transition-transform group-open:rotate-180" />
                </CardAction>
              </CardHeader>
            </summary>
            <CardContent className={cn('mt-4 pt-4', contentClassName)}>
              {children}
            </CardContent>
          </details>
        </Card>
      </section>
    );
  }

  return (
    <section id={sectionId} className="mt-6 scroll-mt-24">
      <Card className={cn('border shadow-sm bg-gray-100 text-on-background', className)}>
        <CardHeader className="bg-muted/30">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
          {action ? <CardAction>{action}</CardAction> : null}
        </CardHeader>
        <CardContent className={cn('pt-4', contentClassName)}>{children}</CardContent>
      </Card>
    </section>
  );
}
