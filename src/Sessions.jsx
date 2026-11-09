import { useEffect, useState } from 'react'

// En local, l'API est sur localhost:8080 ; sur Render, son adresse est donnée par VITE_API_URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// Gestion des séances par l'administrateur : création, modification et suppression
function Sessions(props) {
  const [movies, setMovies] = useState([])
  const [rooms, setRooms] = useState([])
  const [editedSession, setEditedSession] = useState(null)
  const [message, setMessage] = useState('')

  // Charge les films et les salles des listes déroulantes (rechargés quand la programmation change)
  async function loadChoices() {
    const headers = { Authorization: props.authHeader }
    const moviesResponse = await fetch(API_URL + '/api/movies', { headers: headers })
    const roomsResponse = await fetch(API_URL + '/api/rooms', { headers: headers })
    setMovies(await moviesResponse.json())
    setRooms(await roomsResponse.json())
  }

  useEffect(function () {
    loadChoices()
  }, [props.sessions])

  // Crée la séance, ou modifie celle en cours d'édition
  async function saveSession(event) {
    event.preventDefault()
    const form = new FormData(event.target)
    const session = {
      movieId: form.get('movieId'),
      roomId: form.get('roomId'),
      sessionDt: form.get('sessionDt'),
    }

    let url = API_URL + '/api/sessions'
    let method = 'POST'
    if (editedSession) {
      url = url + '/' + editedSession.id
      method = 'PUT'
    }

    const response = await fetch(url, {
      method: method,
      headers: { Authorization: props.authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    })

    if (response.ok) {
      event.target.reset()
      setEditedSession(null)
      setMessage('Séance enregistrée')
      props.onChange()
    } else {
      const data = await response.json()
      setMessage(data.detail)
    }
  }

  // Supprime la séance après confirmation : ses réservations sont supprimées aussi
  async function deleteSession(session) {
    if (!window.confirm('Supprimer la séance de « ' + session.movie.title + ' » et ses réservations ?')) {
      return
    }
    await fetch(API_URL + '/api/sessions/' + session.id, { method: 'DELETE', headers: { Authorization: props.authHeader } })
    setEditedSession(null)
    setMessage('Séance supprimée')
    props.onChange()
  }

  function formatDate(sessionDt) {
    return new Date(sessionDt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  }

  let formTitle = 'Nouvelle séance'
  let formKey = 'new'
  let movieId = ''
  let roomId = ''
  let sessionDt = ''
  if (editedSession) {
    formTitle = 'Modifier la séance de « ' + editedSession.movie.title + ' »'
    formKey = editedSession.id
    movieId = editedSession.movie.id
    roomId = editedSession.room.id
    sessionDt = editedSession.sessionDt.slice(0, 16)
  }

  return (
    <section className="panel">
      <h2>Gestion des séances</h2>
      <ul>
        {props.sessions.map((session) => (
          <li key={session.id}>
            {session.movie.title} : {formatDate(session.sessionDt)}, {session.room.name}{' '}
            <button onClick={() => setEditedSession(session)}>Modifier</button>
            <button onClick={() => deleteSession(session)}>Supprimer</button>
          </li>
        ))}
      </ul>

      <form key={formKey} onSubmit={saveSession}>
        <h3>{formTitle}</h3>
        <label>
          Film{' '}
          <select name="movieId" defaultValue={movieId} required>
            <option value="">Choisir un film</option>
            {movies.map((movie) => (
              <option key={movie.id} value={movie.id}>
                {movie.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Salle{' '}
          <select name="roomId" defaultValue={roomId} required>
            <option value="">Choisir une salle</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date et horaire <input name="sessionDt" type="datetime-local" defaultValue={sessionDt} required />
        </label>
        <button>Enregistrer</button>
        {editedSession && (
          <button type="button" onClick={() => setEditedSession(null)}>
            Annuler
          </button>
        )}
      </form>

      <p>{message}</p>
    </section>
  )
}

export default Sessions
