import { useEffect, useState } from 'react'
import Auth from './Auth.jsx'
import Ticket from './Ticket.jsx'
import Movies from './Movies.jsx'
import Sessions from './Sessions.jsx'
import Reservations from './Reservations.jsx'

// En local, l'API est sur localhost:8080 ; sur Render, son adresse est donnée par VITE_API_URL
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/sessions'
const MY_TICKETS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/reservations/mine'
// Appelle l'API et lance une erreur avec le message du back si la requête échoue
async function callApi(url, method, authHeader) {
  const options = { method: method }
  if (authHeader) {
    options.headers = { Authorization: authHeader }
  }

  const response = await fetch(url, options)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail)
  }
  return data
}

function App() {
  const [sessions, setSessions] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [seatCount, setSeatCount] = useState(1)
  const [seats, setSeats] = useState([])
  const [availableIds, setAvailableIds] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [message, setMessage] = useState('')
  const [authHeader, setAuthHeader] = useState('')
  const [myTickets, setMyTickets] = useState([])
  const [role, setRole] = useState('')

  // Charge la programmation (séances à venir) à l'ouverture de la page
  async function loadSessions() {
    try {
      setSessions(await callApi(API_URL, 'GET'))
    } catch (error) {
      setMessage(error.message)
    }
  }

  useEffect(function () {
    loadSessions()
  }, [])

  // Charge tous les sièges de la salle de la séance choisie et l'id des sièges libres
  async function loadSeats(id) {
    setSessionId(id)
    setSeats([])
    setSelectedIds([])
    setMessage('')

    try {
      const allSeats = await callApi(API_URL + '/' + id + '/seats', 'GET')
      const availableSeats = await callApi(API_URL + '/' + id + '/available-seats', 'GET')

      const ids = []
      for (const seat of availableSeats) {
        ids.push(seat.id)
      }

      setAvailableIds(ids)
      setSeats(allSeats)
    } catch (error) {
      setMessage(error.message)
    }
  }

  // Ajoute le siège à la sélection, ou l'enlève s'il y est déjà
  function toggleSeat(seatId) {
    if (selectedIds.includes(seatId)) {
      setSelectedIds(selectedIds.filter((id) => id !== seatId))
    } else {
      setSelectedIds(selectedIds.concat(seatId))
    }
  }

  // Envoie la sélection au back, qui vérifie les règles de l'US03
  async function submitSelection() {
    const url = API_URL + '/' + sessionId + '/selection?seatCount=' + seatCount + '&seatIds=' + selectedIds.join(',')

    try {
      const selectedSeats = await callApi(url, 'POST')

      const numbers = []
      for (const seat of selectedSeats) {
        numbers.push(seat.seatNum)
      }
      setMessage('Sièges sélectionnés : ' + numbers.join(', '))
    } catch (error) {
      setMessage(error.message)
    }
  }

  // Enregistre la réservation pour l'utilisateur connecté, puis recharge les sièges
  async function confirmReservation() {
    if (authHeader === '') {
      setMessage('Connectez-vous pour réserver')
      return
    }
    const url = API_URL + '/' + sessionId + '/reservations?seatIds=' + selectedIds.join(',')

    try {
      const reservation = await callApi(url, 'POST', authHeader)
      await loadSeats(sessionId)
      setMessage('Réservation n°' + reservation.id + ' confirmée : votre billet est dans « Mes billets » et vous a été envoyé par e-mail')
    } catch (error) {
      setMessage(error.message)
    }
  }

  // Charge les billets (réservations confirmées) de l'utilisateur connecté
  async function loadMyTickets() {
    try {
      setMyTickets(await callApi(MY_TICKETS_URL, 'GET', authHeader))
    } catch (error) {
      setMessage(error.message)
    }
  }

  // À la connexion ou déconnexion, on oublie les billets de l'utilisateur précédent
  function handleLogin(header, userRole) {
    setAuthHeader(header)
    setRole(userRole)
    setMyTickets([])
  }

  function formatDate(sessionDt) {
    return new Date(sessionDt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  }

  function seatClass(seat) {
    if (selectedIds.includes(seat.id)) {
      return 'seat selected'
    }
    return 'seat'
  }

  function isOccupied(seat) {
    return !availableIds.includes(seat.id)
  }

  return (
    <main>
      <h1>Grand Cinéma</h1>
      <Auth onLogin={handleLogin} />

      {role === 'ADMIN' && <Movies authHeader={authHeader} onChange={loadSessions} />}
      {role === 'ADMIN' && <Sessions authHeader={authHeader} sessions={sessions} onChange={loadSessions} />}
      {role === 'ADMIN' && <Reservations authHeader={authHeader} sessions={sessions} />}

      {authHeader !== '' && (
        <section>
          <h2>Mes billets</h2>
          <button onClick={loadMyTickets}>Afficher mes billets</button>
          {myTickets.map((myTicket) => (
            <Ticket key={myTicket.id} reservation={myTicket} />
          ))}
        </section>
      )}

      <h2>Programmation</h2>
      <ul>
        {sessions.map((session) => (
          <li key={session.id}>
            {session.movie.title} : {formatDate(session.sessionDt)}, {session.room.name}{' '}
            <button onClick={() => loadSeats(session.id)}>Choisir</button>
          </li>
        ))}
      </ul>

      {seats.length > 0 && (
        <div>
          <label>
            Nombre de places{' '}
            <input type="number" min="1" value={seatCount} onChange={(event) => setSeatCount(event.target.value)} />
          </label>

          <p>
            {availableIds.length} places libres sur {seats.length}
          </p>
          <p>Vert : libre, gris : occupé, bleu : sélectionné</p>

          <div className="seats">
            {seats.map((seat) => (
              <button
                key={seat.id}
                className={seatClass(seat)}
                disabled={isOccupied(seat)}
                onClick={() => toggleSeat(seat.id)}
              >
                {seat.seatNum}
              </button>
            ))}
          </div>

          <p>{selectedIds.length} siège(s) sélectionné(s) sur {seatCount}</p>
          <button onClick={submitSelection}>Valider la sélection</button>
          <button onClick={confirmReservation}>Confirmer la réservation</button>
        </div>
      )}

      <p>{message}</p>
    </main>
  )
}

export default App
