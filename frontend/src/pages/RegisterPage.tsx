import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

export function RegisterPage() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await api<{ access_token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      localStorage.setItem('token', res.access_token)
      nav('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  return (
    <div className="auth">
      <h1>Esimese kasutaja loomine</h1>
      <p className="muted">
        See vorm kehtib ainult siis, kui andmebaasis pole veel ühtegi kasutajat
        (master konto).
      </p>
      <form onSubmit={onSubmit}>
        <label>
          E-post
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            autoComplete="username"
          />
        </label>
        <label>
          Parool (vähemalt 8 märki)
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <button type="submit">Loo konto</button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      <p>
        <Link to="/login">Mul on juba konto</Link>
      </p>
    </div>
  )
}
