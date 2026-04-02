export type AuditEvent =
  | {
      type: 'award_success';
      shopId: string;
      staffUserId: string;
      customerId: string;
      points: number;
      transactionId: string;
    }
  | {
      type: 'award_deduped';
      shopId: string;
      staffUserId: string;
      customerId: string;
      points: number;
      transactionId: string;
    }
  | {
      type: 'dashboard_view';
      shopId: string;
      staffUserId: string;
      range: string;
    };

export function auditLog(event: AuditEvent): void {
  console.log(JSON.stringify({ at: new Date().toISOString(), ...event }));
}

