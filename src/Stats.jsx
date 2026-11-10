import { useEffect, useState } from 'react'

// En local, l'API est sur localhost:8080 ; sur Render, son adresse est donnée par VITE_API_URL
const STATS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/stats'
// Groupe (salle, horaire) qui a le plus de places réservées, ou null si la liste est vide
function bestGroup(groups) {
  let best = null
  for (const group of groups) {
    if (best === null || group.bookedSeats > best.bookedSeats) {
      best = group
    }
  }
  return best
}

// Tableau d'un cumul (par salle, par horaire) : réservées, proposées et taux de remplissage
function GroupTable(props) {
  const bestRow = bestGroup(props.groups)
  let best = ''
  if (bestRow) {
    best = bestRow.label
  }

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

// Analyse de la fréquentation pour l'administrateur, sur toutes les séances ou sur une période (du ... au ...)
function Stats(props) {
  const [stats, setStats] = useState(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  async function loadStats(fromDate, toDate) {
    let url = STATS_URL + '?from=' + fromDate + '&to=' + toDate
    if (fromDate === '' && toDate === '') {
      url = STATS_URL
    } else if (fromDate === '') {
      url = STATS_URL + '?to=' + toDate
    } else if (toDate === '') {
      url = STATS_URL + '?from=' + fromDate
    }
    const response = await fetch(url, { headers: { Authorization: props.authHeader } })
    setStats(await response.json())
  }

  // Recharge les statistiques à l'ouverture et quand la programmation change
  useEffect(function () {
    loadStats(from, to)
  }, [props.sessions])

  function filter(event) {
    event.preventDefault()
    loadStats(from, to)
  }

  // Efface la période : toutes les séances
  function showAll() {
    setFrom('')
    setTo('')
    loadStats('', '')
  }

  function formatDate(sessionDt) {
    return new Date(sessionDt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  }

  if (stats === null) {
    return null
  }

  const bestRoom = bestGroup(stats.rooms)
  const bestHour = bestGroup(stats.hours)

  return (
    <section className="panel">
      <form className="period" onSubmit={filter}>
        <label>
          Du <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label>
          Au <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        <button>Filtrer</button>
        <button type="button" onClick={showAll}>
          Tout
        </button>
      </form>

      <h2>Tableau de bord</h2>
      <div className="kpis">
        <div className="kpi">
          <strong>{stats.total.fillRate} %</strong>
          Taux de remplissage global ({stats.total.bookedSeats} places sur {stats.total.totalSeats})
        </div>
        <div className="kpi">
          <strong>{stats.total.bookedSeats}</strong>
          Places vendues
        </div>
        <div className="kpi">
          <strong>{stats.confirmedReservations}</strong>
          Réservations confirmées
        </div>
        <div className="kpi">
          <strong>{stats.cancelledReservations}</strong>
          Réservations annulées
        </div>
        {bestRoom && (
          <div className="kpi">
            <strong>{bestRoom.label}</strong>
            Salle la plus fréquentée
          </div>
        )}
        {bestHour && (
          <div className="kpi">
            <strong>{bestHour.label}</strong>
            Horaire le plus demandé
          </div>
        )}
      </div>

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
