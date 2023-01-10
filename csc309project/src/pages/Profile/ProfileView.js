import PaymentList from "../../components/PaymentList";
import SubscriptionCard from "../../components/SubscriptionCard";
import CurrentSubscription from "./CurrentSubscription";
import profileDefault from "../../assets/blank-profile-photo.jpg";

const ProfileView = ({userInfo, subInfo, editSwitch}) => {

    return (
        <>
            <div className="row">
                <div className="col-2 pb-3 pt-2 mx-auto">
                    {userInfo.avatar !== null ? (
                        <>
                        <img src={userInfo.avatar} className="border border-5 border-primary rounded-circle img-fluid" />
                        </>
                    ) : (
                        <>
                            <img src={profileDefault} className="border border-5 border-primary rounded-circle img-fluid" />
                        </>
                    )}
                </div>
            </div>
            <div style={{backgroundColor: 'LightGrey', alignContent: 'center'}}>
                <div className="row justify-content-center">
                    <div className="col-5">
                        <h1 className="text-center">
                            <b>{userInfo.username}</b> (User ID: {userInfo.id})
                        </h1>

                        <div style={{marginTop: 50, fontSize: 20, alignContent: 'center'}}>
                            <p><b>Name:</b> {userInfo.first_name !== "" ?
                                (<span>{userInfo.first_name} {userInfo.last_name}</span>) : (<span>No name provided</span>)}</p>
                            <p><b>Email:</b> {userInfo.email} </p>
                            <p><b>Phone Number:</b> {userInfo.phoneNumber} </p>

                            <p><b>Credit Card:</b> {userInfo.creditCardNumber !== null ?
                                (<span>{userInfo.creditCardNumber}</span>) :
                                (<span>None - Required in order to make subscription and join classes! </span>)}</p>
                        </div>
                    </div>
                </div>

                <div className='editFooter text-center'
                     style={{margin: 20, marginBottom: 40}}>
                    <button className="btn btn-success m-2"
                            style={{width: "200px", fontSize: "20px"}}
                            onClick={() => {
                                editSwitch(true);
                            }}>
                        Edit Profile
                    </button>
                </div>
            </div>

            <div className="row justify-content-center"
                 style={{marginBottom: 50}}>
                <div className="col-7" style={{fontSize: 20}}>
                    <span><b>Active Subscription:</b> </span>
                    {userInfo.activeSubscription != null ?
                        (
                            <div>
                                <CurrentSubscription />
                            </div>
                        ) :
                        (<span>No active subscription.</span>)}
                </div>
            </div>

            <PaymentList userInfo={{creditCardNumber: userInfo.creditCardNumber, 
                                    activeSubscription: userInfo.activeSubscription,
                                    id: userInfo.id }} className="p-3"
            />
        </>
    )
}

export default ProfileView;