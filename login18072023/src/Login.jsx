import React from 'react'
import { useState } from 'react';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import {useNavigate} from 'react-router-dom'


export default function Login() {
  const navigate = useNavigate()
  const [inputs, setInputs] = useState({});
  const MySwal = withReactContent(Swal)

  const handleChange = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setInputs(values => ({...values, [name]: value}))
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    var myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");

var raw = JSON.stringify({
  "loginname": inputs.loginname,
  "passweb": inputs.password,
  "expiresIn":6000000
});

var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: raw,
  redirect: 'follow'
};

fetch("http://10.0.214.206:3333/login", requestOptions)
  .then(response => response.json())
  .then(result => {
    console.log(result);
    if(result.status === 'ok'){
      MySwal.fire({
        title: <strong>Good job!</strong>,
        html: <i>{result.message}</i>,
        icon: 'success'
      }).then((value) => {
        localStorage.setItem('token',result.token)
        navigate('/Profile')
      })
    }
    else{
      MySwal.fire({
        title: <strong>login Bad !</strong>,
        html: <i>{result.message}</i>,
        icon: 'Error'
      })
    }
  })
    
  }

  return (
    <div>

<form onSubmit={handleSubmit}>
      <label >loginname :
      <input 
        type="text" 
        name="loginname" 
        value={inputs.loginname || ""} 
        onChange={handleChange}
      /> <br />
      </label>
      <label>password :
        <input 
          type="password" 
          name="password" 
          value={inputs.password || ""} 
          onChange={handleChange}
        /> <br />
        </label>
        <input type="submit" />
    </form>
    </div>
  )
}
