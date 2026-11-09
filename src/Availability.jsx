import { useState } from 'react'

// En local, l'API est sur localhost:8080 ; sur Render, son adresse est donnée par VITE_API_URL
const SESSIONS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/sessions'

// Disponibilités d'une séance pour l'administrateur : places libres, réservées et total de la salle
function Availability(props) {
  const [result, setResult] = useState(null)

  async function loadAvailability(event) {
    const sessionId = event.target.value
    if (sessionId === '') {
      setResult(null)
      return
    }

    const allSeats = await (await fetch(SESSIONS_URL + '/' + sessionId + '/seats')).json()
    const availableSeats = await (await fetch(SESSIONS_URL + '/' + sessionId + '/available-seats')).json()
    setResult({ total: allSeats.length, available: availableSeats.length })
  }

  function formatDate(sessionDt) {
    return new Date(sessionDt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  }

  return (
    <section className="panel">
      <h2>Disponibilités d'une séance</h2>
      <label>
        Séance{' '}
        <select onChange={loadAvailability} defaultValue="">
          <option value="">Choisir une séance</option>
          {props.sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.movie.title} : {formatDate(session.sessionDt)}, {session.room.name}
            </option>
          ))}
        </select>
      </label>

      {result && (
        <p>
          <strong>{result.available} places disponibles</strong> sur {result.total} ({result.total - result.available}{' '}
          réservées)
        </p>
      )}
    </section>
  )
}

export default Availability
