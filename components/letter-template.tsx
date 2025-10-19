import React from "react";

interface LetterTemplateProps {
  senderDept: string;
  senderOrg: string;
  senderAddress: string;
  senderContact: string;
  date: string;
  receiverDept: string;
  subject: string;
  receiverName: string;
  receiverTitle: string;
  body: string;
  actionDeadline?: string;
  senderName: string;
  senderTitle: string;
  senderDeptName: string;
  digitalSignature: string;
  stampUrl: string;
  certId?: string;
}

export const LetterTemplate: React.FC<LetterTemplateProps> = ({
  senderDept,
  senderOrg,
  senderAddress,
  senderContact,
  date,
  receiverDept,
  subject,
  receiverName,
  receiverTitle,
  body,
  actionDeadline,
  senderName,
  senderTitle,
  senderDeptName,
  digitalSignature,
  stampUrl,
  certId,
}) => (
  <div style={{ background: "#fff", padding: "2rem", borderRadius: 12, boxShadow: "0 2px 16px rgba(0,0,0,0.07)", maxWidth: 700, margin: "2rem auto" }}>
    <div style={{ marginBottom: "1rem" }}>
      <div>{senderDept}</div>
      <div>{senderOrg}</div>
      <div>{senderAddress}</div>
      <div>{senderContact}</div>
      <div>{date}</div>
    </div>
    <div style={{ marginBottom: "1rem" }}>
      <div>To: {receiverDept}</div>
      <div>Subject: {subject}</div>
    </div>
    <div style={{ marginBottom: "1rem" }}>
      <div>Dear {receiverTitle} {receiverName},</div>
      <div style={{ marginTop: "1rem" }}>{body}</div>
      {actionDeadline && (
        <div style={{ marginTop: "1rem" }}>
          Please acknowledge receipt and provide necessary actions by {actionDeadline}.
        </div>
      )}
    </div>
    <div style={{ marginTop: "2rem" }}>
      <div>Sincerely,</div>
      <div>{senderName}</div>
      <div>{senderTitle}</div>
      <div>{senderDeptName}</div>
    </div>
    <div style={{ marginTop: "2rem", display: "flex", alignItems: "center" }}>
      <div style={{ marginRight: "2rem" }}>
        <div>Digitally Signed by: {digitalSignature}</div>
        <div>Date: {date}</div>
        {certId && <div>Certificate ID: {certId}</div>}
      </div>
      <div>
        <img src={stampUrl} alt="Department Stamp" style={{ height: 64, borderRadius: 8, border: "1px solid #eee" }} />
      </div>
    </div>
  </div>
);
