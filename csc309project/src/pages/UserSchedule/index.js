import Schedule from "../../components/Schedule";
import {useEffect, useState} from "react";
import handleJsonResponseStatus from "../../components/helpers/handleJsonResponseStatus";
import {useNavigate} from "react-router-dom";

const UserSchedule = () => {
    const navigate = useNavigate();

    const [allStudioIds, setAllStudioIds] = useState([]);

    useEffect(() => {
        fetch(`http://localhost:8000/studios/ids/`, {
            method: 'GET',
            credentials: "same-origin",
            headers: {"Authorization": `Bearer ${localStorage.getItem('csrfAccess')}`},
        })
            .then(response => {
                return handleJsonResponseStatus(response, navigate);
            })
            .then(allStudioIdsFetched => {
                console.log('allStudioIdsFetched:', allStudioIdsFetched);
                setAllStudioIds(allStudioIdsFetched);
            })
            .catch(error => {
                console.log('Error:', error);
            });
    }, []);

    // Now that we have the list of studio IDs in the component state, we can render the component
    return (
        <div>
            <h1>Your Schedule and Session History</h1>
            <Schedule studioIds={allStudioIds} onlyEnrolled={true} showHistory={true}/>
        </div>
    );
};


export default UserSchedule;