import Schedule from "../../components/Schedule";
import {useNavigate, useParams} from "react-router-dom";
import { useEffect, useState } from "react";
import handleJsonResponseStatus from "../../components/helpers/handleJsonResponseStatus";

const StudioDetails = () => {
    const navigate = useNavigate();

    const {studioId} = useParams();
    const [studioInfo, setStudioInfo] = useState({});

    const retrieveStudioInfo = () => {
        var res_status = 0;
        fetch(`http://localhost:8000/studios/${studioId}/`, {
            method: 'GET',
            credentials: "same-origin",
            headers: {"Authorization" : `Bearer ${localStorage.getItem('csrfAccess')}`},
        })
        .then((response) => {

            return handleJsonResponseStatus(response, navigate);
        })
        .then((data) => {
            setStudioInfo(data)
        })
        .catch((error) => {
            console.error(error)
        });
    }

    useEffect(() => {
        // Get the schedule for the studio with the given id
        retrieveStudioInfo();
    }, []);
    

    return (
        <>
            {studioInfo.id !== undefined && (
                <div className="row justify-content-center">
                    <div className="col-8">
                    <h1 className="text-center">{studioInfo.name} (ID {studioInfo.id}) Details</h1>
                    <div style={{marginLeft: '20%', marginTop: 20, fontSize: 20}}>
                        <p className="studio-card-text"><b>Address</b>: {studioInfo.address}</p>
                        <p className="studio-card-text"><b>Postal Code</b>: {studioInfo.postal_code}</p>
                        <p className="studio-card-text">
                            <b>Exact Location:</b>
                            {' '} Latitude is {parseFloat(parseFloat(studioInfo.lat).toFixed(3))},
                            Longitude is {parseFloat(parseFloat(studioInfo.lng).toFixed(3))}<br/>
                        </p>
                        <p className="studio-card-text"><b>Phone Number</b>: {studioInfo.phone}</p>
                        <div style={{marginTop: 10}}>
                            <b>Amenities</b>:
                            {studioInfo.amenities.length === 0 ?
                                ' None' :
                                <ul className="studio-card-text">
                                    {studioInfo.amenities.map((amenity) => (
                                        <li>{amenity.type} ({amenity.quantity})</li>
                                    ))}
                                </ul>
                            }
                        </div>
                        <div style={{marginTop: 10}}>
                            <b>Coaches</b>:
                            {studioInfo.coaches.length === 0 ?
                                ' None' :
                                <ul className="studio-card-text">
                                    {studioInfo.coaches.map((coach) => (
                                        <li>{coach}</li>
                                    ))}
                                </ul>
                            }
                        </div>
                    </div>
                </div>
                <div className="text-center" style={{marginTop: 10}}>
                    <p><b>Pictures:</b>
                    {studioInfo.images.length === 0 ? (<p>This studio has no pictures.</p>) :
                    (
                        <>
                        {studioInfo.images.map((image) => {
                            let imagePathListLinux =  image.path.split("studio_images/");
                            let imagePathListWindows =  image.path.split("studio_images\\");
                            // Get imageFilName from the list that has been split
                            let imageFilName = imagePathListWindows.length > 1 ? imagePathListWindows[1] : imagePathListLinux[1];
                            let imageUrl = `http://localhost:8000/media/studio_images/${imageFilName}`;
                            // console.log('imageUrl:', imageUrl);
                            return <div className="col-md-auto">
                                <img src={imageUrl} className="w-25 p-1 img-fluid" />
                            </div>
                        })}
                        </>
                    )
                    }
                    </p>
                </div>
                </div>
            )}
            <div style={{marginTop: 10}}>
                <div className="text-center">
                    <h1>Studio Schedule</h1>
                </div>
                <div>
                    <Schedule studioIds={[studioId]} onlyEnrolled={false} showHistory={false}/>
                </div>
            </div>
        </>
    )
}

export default StudioDetails;