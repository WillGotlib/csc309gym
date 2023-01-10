import {createContext, useState} from "react";

export const useUserContext = () => {
    const [context, setContext] = useState(
        {
            id: "", 
            activeSubscription: "", 
            csrfAccess: "", 
            csrfRefresh: ""
        });

    return {
        context,
        setContext
    }
}

const UserContext = createContext({
    context: {id: "", csrfAccess: "", csrfRefresh: ""}
});

export default UserContext;