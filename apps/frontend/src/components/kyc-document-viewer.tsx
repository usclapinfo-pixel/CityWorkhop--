import { useEffect, useState } from 'react';
import { ApiClientError } from '../services/api-client';
import { getKycDocumentAccess, type KycDocumentAccess } from '../services/kyc-service';
import type { KycRecord } from '../types/admin';
import { Button, Loading } from './ui';

interface KycDocumentViewerProps {
  userId: string;
  record: KycRecord;
  onClose: () => void;
}

export function KycDocumentViewer({ userId, record, onClose }: KycDocumentViewerProps) {
  const [access, setAccess] = useState<KycDocumentAccess | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setAccess(null);
    setExpired(false);
    getKycDocumentAccess(userId, record.id)
      .then((result) => {
        if (!active) return;
        setAccess(result);
        window.setTimeout(() => active && setExpired(true), Math.max(0, (result.expiresIn - 1) * 1000));
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof ApiClientError && reason.status === 403
          ? 'You are not authorized to access this KYC record.'
          : reason instanceof ApiClientError
            ? reason.message
            : 'The document is unavailable.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [record.id, userId]);

  const isImage = access?.contentType?.startsWith('image/');
  const isPdf = access?.contentType === 'application/pdf';

  return <div className="document-viewer" role="dialog" aria-modal="true" aria-labelledby="document-viewer-title">
    <div className="document-viewer-header"><div><div className="section-label">SECURE DOCUMENT ACCESS</div><h2 id="document-viewer-title">{record.documentType}</h2></div><Button variant="quiet" onClick={onClose}>Close</Button></div>
    {loading && <Loading label="Requesting temporary access" />}
    {!loading && error && <div className="state-panel state-error"><strong>Document unavailable</strong><span>{error}</span></div>}
    {!loading && !error && expired && <div className="state-panel state-error"><strong>Access expired</strong><span>Close this view and request a new temporary document access link.</span></div>}
    {!loading && !error && !expired && access && <>
      <div className="document-preview">{isImage && <img src={access.accessUrl} alt={`${record.documentType} document`} />}{isPdf && <iframe title={`${record.documentType} PDF`} src={access.accessUrl} />}{!isImage && !isPdf && <div className="state-panel"><strong>Preview unavailable</strong><span>This file type cannot be previewed here.</span></div>}</div>
      <div className="document-viewer-actions"><span className="muted">Temporary access expires in {access.expiresIn} seconds.</span><a className="button button-primary" href={access.accessUrl} target="_blank" rel="noreferrer" download>Download</a></div>
    </>}
  </div>;
}
