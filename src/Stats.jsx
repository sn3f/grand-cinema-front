import { useEffect, useState } from 'react'

// En local, l'API est sur localhost:8080 ; sur Render, son adresse est donnée par VITE_API_URL
const STATS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/stats'

// Libellé du groupe qui a le plus de places réservées (affiché en gras)
function mostBooked(groups) {
  let best = null
  for (const group of groups) {
    if (best === null || group.bookedSeats > best.bookedSeats) {
      best = group
    }
  }
  if (best === null) {
    return ''
  }
  return best.label
}

// Tableau d'un cumul (par salle, par horaire) : réservées, proposées et taux de remplissage
function GroupTable(props) {
  const best = mostBooked(props.groups)

  return (
    <div className="table">
      <table>
        <thead>
          <tr>
            <th>{props.title}</th>
            <th>Places réservées</th>
            <th>Places proposées</th>
            <th>Taux de remplissage</th>
          </tr>
        </thead>
        <tbody>
          {props.groups.map((group) => (
            <tr key={group.label} className={group.label === best ? 'best' : ''}>
              <td>{group.label}</td>
              <td>{group.bookedSeats}</td>
              <td>{group.totalSeats}</td>
              <td>{group.fillRate} %</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Analyse de la fréquentation pour l'administrateur : par séance, par salle et par horaire
function Stats(props) {
  const [stats, setStats] = useState(null)

  async function loadStats() {
    const response = await fetch(STATS_URL, { headers: { Authorization: props.authHeader } })
    setStats(await response.json())
  }

  // Recharge les statistiques à l'ouverture et quand la programmation change
  useEffect(function () {
    loadStats()
  }, [props.sessions])

  function formatDate(sessionDt) {
    return new Date(sessionDt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  }

  if (stats === null) {
    return null
  }

  return (
    <section className="panel">
      <h2>Fréquentation</h2>

      <h3>Par séance</h3>
      <div className="table">
        <table>
          <thead>
            <tr>
              <th>Film</th>
              <th>Séance</th>
              <th>Salle</th>
              <th>Places réservées</th>
              <th>Capacité</th>
              <th>Taux de remplissage</th>
            </tr>
          </thead>
          <tbody>
            {stats.sessions.map((session) => (
              <tr key={session.sessionId}>
                <td>{session.movieTitle}</td>
                <td>{formatDate(session.sessionDt)}</td>
                <td>{session.roomName}</td>
                <td>{session.bookedSeats}</td>
                <td>{session.totalSeats}</td>
                <td>{session.fillRate} %</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Par salle</h3>
      <GroupTable title="Salle" groups={stats.rooms} />

      <h3>Par horaire</h3>
      <GroupTable title="Horaire" groups={stats.hours} />
    </section>
  )
}

export default Stats
