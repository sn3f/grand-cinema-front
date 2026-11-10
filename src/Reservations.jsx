import { useEffect, useState } from 'react'

// En local, l'API est sur localhost:8080 ; sur Render, son adresse est donnée par VITE_API_URL
const RESERVATIONS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/reservations'

// Liste et recherche des réservations par l'administrateur
function Reservations(props) {
  const [reservations, setReservations] = useState([])
  const [search, setSearch] = useState('')

  async function loadReservations(text) {
    const response = await fetch(RESERVATIONS_URL + '?search=' + encodeURIComponent(text), {
      headers: { Authorization: props.authHeader },
    })
    setReservations(await response.json())
  }

  // Recharge la liste à l'ouverture et quand la programmation change (séance ou film supprimé)
  useEffect(function () {
    loadReservations(search)
  }, [props.sessions])

  function submitSearch(event) {
    event.preventDefault()
    const text = new FormData(event.target).get('search')
    setSearch(text)
    loadReservations(text)
  }

  function formatDate(date) {
    return new Date(date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  }

  function seatNumbers(reservation) {
    const numbers = []
    for (const reservationSeat of reservation.reservationSeats) {
      numbers.push(reservationSeat.seat.seatNum)
    }
    return numbers.join(', ')
  }

  function statusLabel(status) {
    if (status === 'CONFIRMED') {
      return 'Confirmée'
    }
    return 'Annulée'
  }

  return (
    <section className="panel">
      <h2>Réservations</h2>
      <form onSubmit={submitSearch}>
        <label>
          Rechercher (n°, client, e-mail ou film) <input name="search" defaultValue={search} />
        </label>
        <button>Rechercher</button>
      </form>

      <p>{reservations.length} réservation(s)</p>
      <div className="table">
        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>Client</th>
              <th>Film</th>
              <th>Séance</th>
              <th>Salle</th>
              <th>Sièges</th>
              <th>Statut</th>
              <th>Réservée le</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => (
              <tr key={reservation.id}>
                <td>{reservation.id}</td>
                <td>
                  {reservation.user.firstName} {reservation.user.lastName}
                  <br />
                  {reservation.user.email}
                </td>
                <td>{reservation.session.movie.title}</td>
                <td>{formatDate(reservation.session.sessionDt)}</td>
                <td>{reservation.session.room.name}</td>
                <td>{seatNumbers(reservation)}</td>
                <td>{statusLabel(reservation.status)}</td>
                <td>{formatDate(reservation.creationDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default Reservations
