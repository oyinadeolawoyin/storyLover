import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthService } from '@/service/authService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault() // stop the page from reloading
    setError('')
    setSubmitting(true)

    try {
      await AuthService.signIn(email, password)
      navigate('/admin')
    } catch (err) {
      console.error(err)
      setError('Wrong email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-butter-soft/60 to-background px-4">
      <div className="w-full max-w-sm">
        <p className="text-center font-heading text-3xl font-bold">
          Story<span className="rounded-md bg-primary/90 px-1.5 text-primary-foreground">Lover</span>
        </p>
        <p className="hand mt-1 text-center text-2xl text-sky">Admin login</p>

        <form onSubmit={handleSubmit} className="card-soft mt-6 space-y-4 p-6">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-semibold">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-semibold">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Logging in...' : 'Log in'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm">
          <Link to="/" className="font-semibold text-sky hover:underline">
            Back to the site
          </Link>
        </p>
      </div>
    </div>
  )
}