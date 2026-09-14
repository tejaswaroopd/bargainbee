import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { register } from '../api/auth';
import { toast } from '../store/toastStore';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Mail, Lock, User } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'BUYER' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await register(form);
      setAuth(data.user, data.token);
      toast.success('Account created! Welcome to BargainBee 🐝');
      navigate('/browse');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-bee-black">Create your account</h1>
      <p className="text-bee-gray mt-1">Join thousands saving on vouchers</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-input px-4 py-3">
            {error}
          </div>
        )}
        <Input
          label="Full Name"
          type="text"
          placeholder="Priya Sharma"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          leftIcon={<User className="w-4 h-4" />}
          required
        />
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
          placeholder="At least 8 characters"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          leftIcon={<Lock className="w-4 h-4" />}
          hint="Minimum 8 characters"
          required
        />
        <Select
          label="I want to..."
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          options={[
            { value: 'BUYER', label: '🛒 Buy vouchers (Buyer)' },
            { value: 'SELLER', label: '💰 Sell my vouchers (Seller)' },
            { value: 'BOTH', label: '🔄 Both buy and sell' },
          ]}
        />
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Create Account
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-bee-gray">
        By signing up, you agree to our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>.
      </p>
      <p className="mt-4 text-center text-sm text-bee-gray">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-bee-black font-semibold hover:underline">Sign in →</Link>
      </p>
    </div>
  );
}
