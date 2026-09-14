import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { login } from '../api/auth';
import { toast } from '../store/toastStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(form.email, form.password);
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      const role = data.user.role;
      if (role === 'ADMIN') navigate('/dashboard/admin');
      else if (role === 'SELLER') navigate('/dashboard/seller');
      else navigate('/browse');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email: string) => setForm({ email, password: 'Demo1234!' });

  return (
    <div>
      <h1 className="text-2xl font-bold text-bee-black">Welcome back 👋</h1>
      <p className="text-bee-gray mt-1">Sign in to your BargainBee account</p>

      {/* Demo shortcuts */}
      <div className="mt-4 p-4 bg-bee-yellow-light border border-bee-yellow rounded-card">
        <p className="text-xs font-semibold text-bee-black mb-2">🎯 Demo Accounts (password: Demo1234!)</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Buyer', email: 'buyer1@demo.com' },
            { label: 'Seller', email: 'seller1@demo.com' },
            { label: 'Admin', email: 'admin@bargainbee.in' },
          ].map((d) => (
            <button
              key={d.email}
              onClick={() => fillDemo(d.email)}
              className="text-xs bg-white border border-bee-yellow px-3 py-1 rounded-full hover:bg-bee-yellow transition-colors font-medium"
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-input px-4 py-3">
            {error}
          </div>
        )}
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          leftIcon={<Lock className="w-4 h-4" />}
          required
        />
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-bee-gray">
        Don't have an account?{' '}
        <Link to="/auth/register" className="text-bee-black font-semibold hover:underline">Create one →</Link>
      </p>
    </div>
  );
}
