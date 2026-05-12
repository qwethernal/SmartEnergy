import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

type Device = {
  id: string
  name: string
  description: string
  lastState: string
  manualOverride: boolean
  thresholdEurMwh: string | null
}

type Me = {
  id: string
  email: string
  role: string
}

export function PanelPage() {
  const nav = useNavigate()
  const [me, setMe] = useState<Me | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      nav('/login')
      return
    }
    void load()
  }, [nav])

  async function load() {
    setError(null)
    try {
      const profile = await api<Me>('/api/auth/me')
      setMe(profile)
      const list = await api<Device[]>('/api/devices')
      setDevices(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed')
    }
  }

  function logout() {
    localStorage.removeItem('token')
    nav('/login')
  }

  return (
    <div className="panel">
      <header className="top">
        <div>
          <h1>Juhtimiskeskus</h1>
          {me ? (
            <p className="muted">
              {me.email} · roll: {me.role}
            </p>
          ) : null}
        </div>
        <div className="actions">
          <button type="button" onClick={() => void load()}>
            Värskenda
          </button>
          <button type="button" onClick={logout}>
            Logi välja
          </button>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <section>
        <h2>Seadmed</h2>
        {devices.length === 0 ? (
          <p className="muted">Seadmeid pole veel lisatud.</p>
        ) : (
          <table className="devices">
            <thead>
              <tr>
                <th>Nimi</th>
                <th>Olek</th>
                <th>Lävi €/MWh</th>
                <th>Ülekirjutus</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.lastState}</td>
                  <td>{d.thresholdEurMwh ?? '—'}</td>
                  <td>{d.manualOverride ? 'jah' : 'ei'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="muted">
          API: <code>POST /api/devices</code> (JWT). Täielik vorm tuleb järgmises
          iteratsioonis.
        </p>
      </section>
    </div>
  )
}
