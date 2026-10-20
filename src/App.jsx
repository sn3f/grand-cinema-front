import { useState } from 'react'

const API_URL = 'http://localhost:8080/api/sessions'

// Appelle l'API et lance une erreur avec le message du back si la requête échoue
async function callApi(url, method) {
  const response = await fetch(url, { method: method })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail)
  }
  return data
}

function App() {
  const [sessionId, setSessionId] = useState(1)
  const [seatCount, setSeatCount] = useState(1)
  const [seats, setSeats] = useState([])
  const [availableIds, setAvailableIds] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [message, setMessage] = useState('')

  // Charge tous les sièges de la salle et l'id des sièges libres
  async function loadSeats() {
    setSeats([])
    setSelectedIds([])
    setMessage('')

    try {
      const allSeats = await callApi(API_URL + '/' + sessionId + '/seats', 'GET')
      const availableSeats = await callApi(API_URL + '/' + sessionId + '/available-seats', 'GET')

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

      <label>
        Séance n°{' '}
        <input type="number" min="1" value={sessionId} onChange={(event) => setSessionId(event.target.value)} />
      </label>
      <button onClick={loadSeats}>Afficher les sièges</button>

      {seats.length > 0 && (
        <div>
          <label>
            Nombre de places{' '}
            <input type="number" min="1" value={seatCount} onChange={(event) => setSeatCount(event.target.value)} />
          </label>

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
        </div>
      )}

      <p>{message}</p>
    </main>
  )
}

export default App
