import {useEffect, useState, useContext} from "react"
import SubscriptionCard from "../../components/SubscriptionCard";
import SubscriptionContext from "../../contexts/subscriptionContext";
import UserContext from "../../contexts/userContext";
import handleJsonResponseStatus from "../../components/helpers/handleJsonResponseStatus";
import {useNavigate} from "react-router-dom";


const CurrentSubscription = () => {

    // This thing would be hugely simpler if we made a current subscription CONTEXT, or integrated it with the current context
    const [subInfo, setSubInfo] = useState({});

    const {context, setContext} = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
        console.log("\n\nContext.ActiveSub === ", context);
        if (context.activeSubscription != "" && context.activeSubscription != null) { // We have a subscription. Must retrieve the details.
            retrieveSubscription();
        }
        // TODO: Adjust this setup. Basically if it == "", we need to check and make API calls
        //  because on reload we lose state data.
        // Actually it shouldn't. Should handle refreshing stuff on reload
        // in layout bc that's the component that'll get re-loaded every reload first.

        console.log("In CurrentSubscription – subInfo: ", subInfo);
    }, [context])

    // Given subscription ID, ask the backend for info about it.
    const retrieveSubscription = () => {
        let url = `http://localhost:8000/accounts/subscriptions/${context.activeSubscription}/`;
        console.log('URL: ', url);
        console.log("\n\nContext.ActiveSub === ", context.activeSubscription);
        if (context.activeSubscription === "") {
            return;
        }
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

    const cancelSubscription = () => {
        fetch(`http://localhost:8000/accounts/subscriptions/unsubscribe/`, {
            method: 'GET',
            credentials: "same-origin",
            headers: {"Authorization": `Bearer ${context.csrfAccess}`},
        })
        .then((response) => {
            return handleJsonResponseStatus(response, navigate);
        })
        .then((json) => {
            console.log(json);
            setSubInfo({});
            setContext({...context, activeSubscription: ""});
            localStorage.setItem('activeSubscription', "");
        })
    }

    return (
        <>
            {subInfo.id ? (
                    <div className="row">
                        <div className="col-8">
                            <SubscriptionCard sub={subInfo}/>
                        </div>
                        <div className="col-4 align-middle text-center">
                            <div className="btn btn-warning" onClick={() => {
                                cancelSubscription();
                            }}>
                                Cancel Subscription
                            </div>
                        </div>
                    </div>)
                : (<div style={{fontSize: 20, marginLeft: 25}}>You are not currently subscribed to any subscription.</div>)}
        </>
    )
}

export default CurrentSubscription;