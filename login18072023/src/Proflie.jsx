import { useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'


export default function Profile() {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState([]);
  const MySwal = withReactContent(Swal)

  useEffect(() => {
    const token = localStorage.getItem('token');
    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      redirect: 'follow'
    };

    fetch("http://10.0.214.206:3333/authen", requestOptions)
      .then(response => response.json())
      .then(result => {
        if (result.status === 'ok') {
          setUser(result.user)
          setIsLoaded(true);
        } else if (result.status === 'error' && result.message === 'jwt expired') {
          MySwal.fire({
            title: <strong> หมดอายุ!</strong>,
            html: <i>{result.message}</i>,
            icon: 'Error'
          }).then((value)=>{
              // Redirect to login page if JWT has expired
           navigate('/');
          })
          
          
        }
        console.log(result);
      })
      .catch(error => console.log('error', error));
  }, [navigate]);
  const Logout = () => { 
    localStorage.removeItem('token');
    navigate('/')
  };

  if (!isLoaded) {
    // You can add a loading indicator here if needed
    return (<div>Loading...ไม่ได้</div>);
  }else{
    return (
      <div>
       <div>user : {user.loginname}</div>
       <div>name : {user.name}</div>
       <div>ตำแหน่ง : {user.entryposition}</div>
       <div>หน้าที่ : {user.groupname}</div>
       <button onClick={Logout}>LogOut</button>
      </div>
    );
  }

  
}
