import {useContext, useEffect} from "react";
import {Link, Outlet, useNavigate} from "react-router-dom";
import UserContext from "../../contexts/userContext";
import logo from "../../assets/tfc.png"
import handleJsonResponseStatus from "../helpers/handleJsonResponseStatus";


const Layout = () => {
    const {context, setContext} = useContext(UserContext);
    const navigate = useNavigate();
    
    useEffect(() => { 
        console.log("RELOADED\n")
        // Make sure upon every reload that we're keeping this updated!
        console.log(localStorage.getItem('csrfAccess'));
        console.log(localStorage.getItem('id'));
        console.log(localStorage.getItem('activeSubscription'));

        // checkLoginStatus();

        if (context.csrfAccess !== localStorage.getItem('csrfAccess')) {
            setContext({...context, csrfAccess: localStorage.getItem('csrfAccess')});
            setContext({...context, id: localStorage.getItem('id'), 
                activeSubscription: localStorage.getItem('activeSubscription')});
        }
        console.log("In layout, ", context); // Doesn't appear to be working but it might just be that it takes a bit of time...
    }, [context.csrfAccess])

    const checkLoginStatus = () => {
        // We will test if we're still properly logged in.
        fetch(`http://localhost:8000/accounts/profile/`, {
            method: 'GET',
            credentials: "same-origin",
            headers: {"Authorization": `Bearer ${localStorage.getItem('csrfAccess')}`},
        })
        .then((response) => {
            // if (response.status >= 400) {
            //     console.error("Error: Made connection but something wrong");
            //     localStorage.setItem('id', "");
            //     localStorage.setItem('activeSubscription', "");
            //     localStorage.setItem('csrfAccess', "");
            //     navigate("/logout");
            // } else {
            //     return response.json()
            // }
            return handleJsonResponseStatus(response, navigate);
        })
        .then((json) => {
            console.log('LAYOUT -- Profile Fetch Success:', json);
            localStorage.setItem('id', json.id);
            if (context.id !== json.id) {
                setContext({...context, id: json.id});
            }
            if (context.activeSubscription !== json.activeSubscription) {
                if (json.activeSubscription === null) {
                    localStorage.setItem('activeSubscription', "");
                } else {
                    localStorage.setItem('activeSubscription', json.activeSubscription);
                    setContext({...context, activeSubscription: json.activeSubscription});
                }
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            console.log(localStorage.getItem('csrfAccess'));
        });
    }

    return (
        <>
            <nav className="p-1 bg-info text-white">
                {/* Login Button */}
                <Link to="/" className='btn btn-primary m-1 ms-2'><img src={logo} height="50em" alt="TFC"/></Link>
                {
                    localStorage.getItem('csrfAccess') === "" ?
                        (<Link to="/login" className='btn btn-secondary m-1'>Login</Link>) :
                        (<Link to="/profile" className='btn btn-secondary m-1'>Profile</Link>)
                }
                {/* Register Button */}
                {
                    localStorage.getItem('csrfAccess') !== "" ? (<Link to="/logout" className='btn btn-secondary m-1'>Logout</Link>) :
                        (<Link to="/register" className='btn btn-secondary m-1'>Register</Link>)
                }

                {/* <Link to="/profile" className='btn btn-secondary m-1'>Profile</Link> */}

                {/* TODO: */}
                {localStorage.getItem('csrfAccess') !== "" &&
                    <Link to="/studios" className='btn btn-secondary m-1'>Studios</Link>}
                {localStorage.getItem('csrfAccess') !== "" &&
                    <Link to="/schedule/" className='btn btn-secondary m-1'>Your Schedule</Link>}
                {localStorage.getItem('csrfAccess') !== "" &&
                    <Link to="/subscription" className='btn btn-secondary m-1'>Subscriptions</Link>}


            </nav>
            <div id="metaBody" className="p-3">
                <Outlet/>
            </div>
            <div>
                <p className="text-center bg-info bg-gradient p-2 rounded-3">
                    CSC309 Project, Created by Will Gotlib and Shalev Lifshitz
                </p>
            </div>
        </>
    )
}

export default Layout;