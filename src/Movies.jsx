import { useEffect, useState } from 'react'

// En local, l'API est sur localhost:8080 ; sur Render, son adresse est donnée par VITE_API_URL
const MOVIES_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/movies'

// Gestion des films par l'administrateur : liste, création, modification et suppression
function Movies(props) {
  const [movies, setMovies] = useState([])
  const [editedMovie, setEditedMovie] = useState(null)
  const [message, setMessage] = useState('')

  async function loadMovies() {
    const response = await fetch(MOVIES_URL, { headers: { Authorization: props.authHeader } })
    setMovies(await response.json())
  }

  useEffect(function () {
    loadMovies()
  }, [])

  // Crée le film, ou modifie celui en cours d'édition
  async function saveMovie(event) {
    event.preventDefault()
    const form = new FormData(event.target)
    const movie = {
      title: form.get('title'),
      duration: form.get('duration'),
      description: form.get('description'),
    }

    let url = MOVIES_URL
    let method = 'POST'
    if (editedMovie) {
      url = MOVIES_URL + '/' + editedMovie.id
      method = 'PUT'
    }

    const response = await fetch(url, {
      method: method,
      headers: { Authorization: props.authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(movie),
    })

    if (response.ok) {
      event.target.reset()
      setEditedMovie(null)
      setMessage('Film enregistré')
      loadMovies()
      props.onChange()
    } else {
      const data = await response.json()
      setMessage(data.detail)
    }
  }

  // Supprime le film après confirmation : ses séances et leurs réservations sont supprimées aussi
  async function deleteMovie(movie) {
    if (!window.confirm('Supprimer « ' + movie.title + ' » et toutes ses séances ?')) {
      return
    }
    await fetch(MOVIES_URL + '/' + movie.id, { method: 'DELETE', headers: { Authorization: props.authHeader } })
    setEditedMovie(null)
    setMessage('Film supprimé')
    loadMovies()
    props.onChange()
  }

  let formTitle = 'Nouveau film'
  let formKey = 'new'
  if (editedMovie) {
    formTitle = 'Modifier « ' + editedMovie.title + ' »'
    formKey = editedMovie.id
  }

  return (
    <section>
      <h2>Gestion des films</h2>
      <ul>
        {movies.map((movie) => (
          <li key={movie.id}>
            <strong>{movie.title}</strong> ({movie.duration} min) {movie.description}{' '}
            <button onClick={() => setEditedMovie(movie)}>Modifier</button>
            <button onClick={() => deleteMovie(movie)}>Supprimer</button>
          </li>
        ))}
      </ul>

      <form key={formKey} onSubmit={saveMovie}>
        <h3>{formTitle}</h3>
        <label>
          Titre <input name="title" defaultValue={editedMovie ? editedMovie.title : ''} required />
        </label>
        <label>
          Durée (min) <input name="duration" type="number" min="1" defaultValue={editedMovie ? editedMovie.duration : ''} required />
        </label>
        <label>
          Description <textarea name="description" defaultValue={editedMovie ? editedMovie.description : ''} />
        </label>
        <button>Enregistrer</button>
        {editedMovie && (
          <button type="button" onClick={() => setEditedMovie(null)}>
            Annuler
          </button>
        )}
      </form>

      <p>{message}</p>
    </section>
  )
}

export default Movies
