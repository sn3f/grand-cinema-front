import { QRCodeSVG } from 'qrcode.react'

// Affiche le billet d'une réservation confirmée, avec un QR code contenant son numéro
function Ticket(props) {
  const reservation = props.reservation
  const session = reservation.session

  const numbers = []
  for (const reservationSeat of reservation.reservationSeats) {
    numbers.push(reservationSeat.seat.seatNum)
  }

  const date = new Date(session.sessionDt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })

  return (
    <div className="ticket">
      <h3>Billet n°{reservation.id}</h3>
      <p>Client : {reservation.user.firstName} {reservation.user.lastName}</p>
      <p>Film : {session.movie.title}</p>
      <p>Séance : {date}</p>
      <p>Salle : {session.room.name}</p>
      <p>Siège(s) : {numbers.join(', ')}</p>
      <QRCodeSVG value={'GRAND-CINEMA-RESERVATION-' + reservation.id} />
      <p>Le billet est aussi envoyé par e-mail à {reservation.user.email}</p>
    </div>
  )
}

export default Ticket
