import {createContext, useState} from "react";

export const useSubscriptionContext = () => {
    const [subContext, setSubContext] = useState({subID: ""});

    return {
        subContext,
        setSubContext
    }
}

const SubscriptionContext = createContext({
    context: {subID: ""}
});

export default SubscriptionContext;