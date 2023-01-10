import {useContext, useState} from "react";

import SubscriptionCard from "../../components/SubscriptionCard";
import UserContext from "../../contexts/userContext";
import handleJsonResponseStatus from "../../components/helpers/handleJsonResponseStatus";
import {useNavigate} from "react-router-dom";

const ProfileEdit = ({userInfo, editSwitch}) => {
    const navigate = useNavigate();

    const {context} = useContext(UserContext);
    const [imageState, setImageState] = useState({});
    const [feedback, setFeedback] = useState("");

    const parseForm = (form) => {
        console.log("AVATAR");
        console.log(form.querySelector('#inputAvatar').value);
        const formData = new FormData();

        // Need to only add the ones that have changed upon submission.
        const newFirstName = form.querySelector('#inputFirstName').value;
        const newLastName = form.querySelector('#inputLastName').value;
        const newEmail = form.querySelector('#inputEmail').value;
        const newPhone = form.querySelector('#inputPhone').value;
        const newCard = form.querySelector('#inputCreditCard').value;

        if (newFirstName !== userInfo.first_name) {
            formData.append('first_name', newFirstName);
        }
        if (newLastName !== userInfo.last_name) {
            formData.append('last_name', newLastName);
        }
        if (newEmail !== userInfo.email) {
            formData.append('email', newEmail);
        }
        if (newPhone !== userInfo.phoneNumber) {
            formData.append('phoneNumber', newPhone);
        }
        if (newCard !== userInfo.creditCardNumber && !(newCard === "" && userInfo.creditCardNumber === null)) {
            formData.append('creditCardNumber', newCard);
        }
        console.log("Image State: ", imageState);
        if (imageState.image !== undefined) {
            formData.append('avatar', imageState.image);
        }
        console.log("FORM DATA:",formData);
        updateProfile(formData);
    }

    const updateProfile = (requestData) => {
        var res_status = 400;
        fetch(`http://localhost:8000/accounts/profile/`, {
            method: 'PATCH',
            body: requestData,
            credentials: "same-origin",
            headers: {"Authorization": `Bearer ${localStorage.getItem('csrfAccess')}`},
        })
            .then((response) => {
                return handleJsonResponseStatus(response, navigate);
            })
            .then((json) => {
                if (res_status >= 400) {
                    console.error("Error: Made connection but something wrong");
                    console.log('Failure:', json);
                    setFeedback(json.message);
                } else {
                    console.log('Success:', json);
                    setFeedback("");
                    editSwitch(false);
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log("yes!");
    }

    const handleImageChange = (event) => {
        event.preventDefault();

        let reader = new FileReader();
        let file = event.target.files[0];

        reader.onloadend = () => {
            setImageState({
                image: file,
                imagePreviewUrl: reader.result
            });
        }

        reader.readAsDataURL(file)
    }

    return (
        <>
            <form className="col-8">
                <div className="row g-3 pb-3 align-items-center">
                    <div className="col-auto">
                        <label className="col-form-label">Name</label>
                    </div>
                    <div className="col-5">
                        <input id="inputFirstName" className="form-control"
                               defaultValue={userInfo.first_name}/>
                    </div>
                    <div className="col-5">
                        <input id="inputLastName" className="form-control"
                               defaultValue={userInfo.last_name}/>
                    </div>
                </div>

                <div className="row g-3 pb-3 align-items-center">
                    <div className="col-auto">
                        <label className="col-form-label">Email (Must be Valid)</label>
                    </div>
                    <div className="col-6">
                        <input id="inputEmail" className="form-control"
                               defaultValue={userInfo.email}/>
                    </div>
                </div>

                <div className="row g-3 pb-3 align-items-center">
                    <div className="col-4">
                        <label className="col-form-label">Phone Number (ddd-ddd-dddd)</label>
                    </div>
                    <div className="col-auto">
                        <input id="inputPhone" className="form-control"
                               defaultValue={userInfo.phoneNumber}/>
                    </div>
                </div>

                <div className="row g-3 pb-3 align-items-center">
                    <div className="col-3">
                        <label className="col-form-label">Credit Card Number</label>
                    </div>
                    <div className="col-8">
                        <input id="inputCreditCard" className="form-control"
                               placeholder="Enter your credit card number."
                               defaultValue={userInfo.creditCardNumber ? userInfo.creditCardNumber : ""}/>
                    </div>
                </div>

                <div className="row g-3 pb-3 align-items-center">
                    <div className="col-3">
                        <label className="col-form-label">Avatar</label>
                    </div>
                    <div className="col-8">
                        <input type="file" id="inputAvatar" className="form-control"
                            onChange={handleImageChange}/>
                    </div>
                </div>

                <div>{feedback}</div>

                <div className='editFooter text-center'>
                    <div className="btn btn-danger m-2" onClick={() => {
                        editSwitch(false);
                    }}>
                        Cancel
                    </div>
                    <div className="btn btn-outline-success m-2" onClick={(event) => {
                        parseForm(event.target.closest('form'))
                    }}>
                        Submit
                    </div>
                </div>
            </form>
        </>
    )
}

export default ProfileEdit;