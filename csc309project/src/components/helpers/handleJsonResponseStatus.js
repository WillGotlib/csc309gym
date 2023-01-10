const handleJsonResponseStatus = (response, navigate) => {
    console.log('In HandleJsonResponseStatus, response:', response)

    if (response.ok) {
        return response.json();
    } else if (response.status === 404) {
        throw new Error(response.status + ". The resource could not be found.");
    } else if (response.status === 500) {
        throw new Error(response.status + ". There was a problem with the server.");
    } else if (response.status === 403) {
        console.error(response.status + `. You are not authorized to access this resource
                      (your token probably expired).`);
        navigate('/login');
    } else if (response.status === 401) {
        console.error("403. User is not logged in. Navigating to login page.");
        navigate('/login');
    } else {
        throw new Error(response.status + ". There was a problem with the request.");
    }
}

export default handleJsonResponseStatus;