import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '../components/ui';
import { initiateLoginOtp, verifyLoginOtp } from '../services/auth-service';
import { useAuth } from '../store/auth-context';
import { isAdminRole } from '../utils/roles';
import { UserRole } from '../types/auth';

export function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { setAuthenticatedUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(''); setBusy(true);
    try {
      if (!otpToken) {
        const result = await initiateLoginOtp(phone, 'whatsapp');
        setOtpToken(result.otpToken);
      } else {
        const result = await verifyLoginOtp(otpToken, otp);
        setAuthenticatedUser(result.user);
        const from = (location.state as { from?: string } | null)?.from;
        if (isAdminRole(result.user.role)) {
          navigate(from ?? '/admin/dashboard', { replace: true });
        } else if (result.user.role === UserRole.CUSTOMER) {
          navigate(from ?? '/', { replace: true });
        } else {
          throw new Error('This workspace is restricted to administrators.');
        }
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to continue.'); }
    finally { setBusy(false); }
  }

  return <div className="auth-page"><div className="auth-aside"><span className="eyebrow">CITY WORKSHOP / 04</span><h1>Make every city easier to operate.</h1><p>A focused workspace for approvals, providers, and the people who keep the network moving.</p><div className="signal-line"><span /><span /><span /></div></div><Card className="auth-card"><div className="eyebrow">ADMIN ACCESS</div><h2>{otpToken ? 'Enter your one-time code' : 'Sign in to the console'}</h2><p className="muted">{otpToken ? 'Use the code sent to your registered phone.' : 'Admin access uses the existing WhatsApp OTP flow.'}</p><form onSubmit={submit}>{!otpToken ? <label>Phone number<Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Registered phone number" required /></label> : <label>One-time code<Input value={otp} onChange={(event) => setOtp(event.target.value)} inputMode="numeric" maxLength={6} placeholder="6-digit code" required /></label>}{error && <div className="form-error" role="alert">{error}</div>}<Button type="submit" disabled={busy}>{busy ? 'Working…' : otpToken ? 'Verify and enter' : 'Send access code'}</Button></form></Card></div>;
}
