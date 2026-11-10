import { useState } from 'react'

// En local, l'API est sur localhost:8080 ; sur Render, son adresse est donnée par VITE_API_URL
const AUTH_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/auth'

// Formulaires de connexion et d'inscription, puis affichage de l'utilisateur connecté
function Auth(props) {
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState('')

  // Envoie l'email et le mot de passe à l'API (HTTP Basic) : 200 si corrects, 401 sinon
  async function login(event) {
    event.preventDefault()
    const form = new FormData(event.target)
    const credentials = btoa(form.get('email') + ':' + form.get('password'))

    const response = await fetch(AUTH_URL + '/me', {
      headers: { Authorization: 'Basic ' + credentials },
    })

    if (response.ok) {
      const connectedUser = await response.json()
      setUser(connectedUser)
      setMessage('')
      props.onLogin('Basic ' + credentials, connectedUser.role)
    } else {
      setMessage('Email ou mot de passe incorrect')
    }
  }

  // Crée le compte avec les champs du formulaire d'inscription
  async function register(event) {
    event.preventDefault()
    const formElement = event.target
    const form = new FormData(formElement)
    const newUser = {
      firstName: form.get('firstName'),
      lastName: form.get('lastName'),
      email: form.get('email'),
      password: form.get('password'),
    }

    const response = await fetch(AUTH_URL + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    })
    const data = await response.json()

    if (response.ok) {
      setMessage('Compte créé, vous pouvez vous connecter')
      formElement.reset()
    } else {
      setMessage(data.detail)
    }
  }

  function logout() {
    setUser(null)
    props.onLogin('', '')
  }

  if (user) {
    return (
      <section>
        <p>
          Connecté : {user.firstName} {user.lastName} ({user.role})
        </p>
        <button onClick={logout}>Se déconnecter</button>
      </section>
    )
  }

  return (
    <section>
      <div className="auth">
        <form onSubmit={login}>
          <h2>Connexion</h2>
          <label>
            Email <input name="email" type="email" required />
          </label>
          <label>
            Mot de passe <input name="password" type="password" required />
          </label>
          <button>Se connecter</button>
        </form>

        <form onSubmit={register}>
          <h2>Inscription</h2>
          <label>
            Prénom <input name="firstName" required />
          </label>
          <label>
            Nom <input name="lastName" required />
          </label>
          <label>
            Email <input name="email" type="email" required />
          </label>
          <label>
            Mot de passe <input name="password" type="password" required />
          </label>
          <button>Créer mon compte</button>
        </form>
      </div>

      <p>{message}</p>
    </section>
  )
}

export default Auth
