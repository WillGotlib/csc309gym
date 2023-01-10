import {useEffect, useState, useContext} from "react";
import {useNavigate} from "react-router-dom";

import UserContext from "../../contexts/userContext";
import profileDefault from "../../assets/blank-profile-photo.jpg"
import ProfileView from "./ProfileView";
import ProfileEdit from "./ProfileEdit";
import handleJsonResponseStatus from "../../components/helpers/handleJsonResponseStatus";

const Profile = () => {
    const [userInfo, setUserInfo] = useState({});
    const [subInfo, setSubInfo] = useState({});

    const [edit, setEdit] = useState(false);

    const {context, setContext} = useContext(UserContext);

    const navigate = useNavigate();

    // Get the user's info based on just the context indicator
    useEffect(() => {
        console.log(context);
        retrieveProfile();
        console.log("Active Sub:", localStorage.getItem('activeSubscription'))
        if (localStorage.getItem('activeSubscription') != "" && 
            localStorage.getItem('activeSubscription') !== null) {
            retrieveSubscription();
        } 
        console.log("User Info: ", userInfo);
        if (userInfo.avatar === null) { console.log("it's null")}
    }, [edit, context])

    const retrieveProfile = () => { 
        fetch(`http://localhost:8000/accounts/profile/`, {
            method: 'GET',
            credentials: "same-origin",
            headers: {"Authorization": `Bearer ${localStorage.getItem('csrfAccess')}`},
        })
        .then((response) => {

            return handleJsonResponseStatus(response, navigate);
        })
        .then((json) => {
            console.log('Profile Fetch Success:', json);
            setUserInfo(json);
            localStorage.setItem('id', json.id);
            if (context.id !== json.id) {
                setContext({...context, id: json.id});
            }
            if (context.activeSubscription !== json.activeSubscription) {
                if (json.activeSubscription === null) {
                //     localStorage.setItem('activeSubscription', "");
                //     setContext({...context, activeSubscription: ""});
                } else {
                    localStorage.setItem('activeSubscription', json.activeSubscription);
                    setContext({...context, activeSubscription: json.activeSubscription});
                }
            }
            
            console.log("Active Sub:", localStorage.getItem('activeSubscription'))
            // if (json.activeSubscription !== localStorage.getItem('activeSubscription')) {
            // }
        })
        .then(console.log(context))
        .catch((error) => {
            console.error('Error:', error);
        });
    }

    // Given subscription ID, ask the backend for info about it.
    const retrieveSubscription = () => {
        console.log("retrieveSubscription: active Sub = ", localStorage.getItem('activeSubscription'));
        let url = `http://localhost:8000/accounts/subscriptions/${localStorage.getItem('activeSubscription')}/`
        fetch(url, {
            method: 'GET',
        })
        .then((response) => {

            return handleJsonResponseStatus(response, navigate);
        })
        .then((json) => {
            console.log(json);
            setSubInfo(json);
        })
    }

    const handleEditButton = (new_state) => {
        setEdit(new_state);
        console.log(edit);
    }

    return (
        <>
            {edit ?
                (<ProfileEdit userInfo={userInfo} editSwitch={handleEditButton}/>)
                :
                (<ProfileView userInfo={userInfo} subInfo={subInfo} editSwitch={handleEditButton}/>)
            }
        </>
    )
}

export default Profile;