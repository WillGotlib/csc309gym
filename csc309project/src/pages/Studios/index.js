import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import SearchParamField from "./SearchParamField";
import StudiosList from "./StudiosList";
import StudiosMap from "./StudiosMap";
import wrappedConsoleLog from "../../components/helpers/wrappedConsoleLog";
import handleJsonResponseStatus from "../../components/helpers/handleJsonResponseStatus";

const Studios = () => {
    const [mapKey, setMapKey] = useState(1);
    const [studiosList, setStudiosList] = useState({results: []});
    const [studiosCoords, setStudiosCoords] = useState([]);
    const [page_params, setPageParams] = useState({page: 1, next: null});
    // Toronto Coords (TODO: set as default for demo): 43.6532, -79.3832
    // TODO: Is (0, 0) an error?
    const [userCoords, setUserCoords] = useState({lat: 0, lng: 0});
    const [params, setParams] = useState({
        name: "",
        amenities: "",
        class_names: "",
        coach: "",
    });
    const [gotLocation, setGotLocation] = useState(false);
    const navigate = useNavigate();

    const locationSuccessCallback = (position) => {
        wrappedConsoleLog("Location data access granted. Current coordinates:", position.coords);
        setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude, // TODO: why doesnt show toronto?
        });
        setGotLocation(true);
        // Set mapKey to a random number to force a re-render
        // Source: https://stackoverflow.com/questions/56649094/how-to-reload-a-component-part-of-page-in-reactjs
        setMapKey(Math.random());
    }

    const locationErrorCallback = (error) => {
        console.error(`Unable to get location data. Using default coordinates (${params.lat}, ${params.lng}).`,
                      "Error:", error);
    }

    // Try to get location if not already got it
    // https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition
    if (!gotLocation) {
        navigator.geolocation.getCurrentPosition(locationSuccessCallback, locationErrorCallback);
    }

    // Set up the URL parameters and the URL
    const searchParams = new URLSearchParams(params);
    const url = new URL("http://localhost:8000/studios/list/");
    url.search = searchParams.toString();
    url.searchParams.set('page', page_params.page);
    url.searchParams.set('lat', userCoords.lat);
    url.searchParams.set('lng', userCoords.lng);
    wrappedConsoleLog('Initial URL:', url.toString());

    // Update url when params change and retrieve studios
    useEffect(() => {
        wrappedConsoleLog("params or page_params changed, updating url...");

        // Update the URL. Remove keys with empty values or that are not in params
        url.searchParams.set('page', page_params.page);
        url.searchParams.set('lat', userCoords.lat);
        url.searchParams.set('lng', userCoords.lng);
        Object.keys(params).forEach((key) => {
            if (params[key] === "" || !(key in params)) {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, params[key]);
            }
        });

        console.log("New URL: " + url);
        fetchStudios();
    }, [params, page_params])

    // Reload map users zooms in or out
    const handleZoom = () => {
        setMapKey(Math.random());
    }
    useEffect(() => {
        window.addEventListener('resize', handleZoom);
    }, [])

    const fetchStudios = () => {
        wrappedConsoleLog('FETCHING studios from:', url.toString())

        fetch(url.toString(), {
            method: 'GET',
            credentials: "same-origin",
            headers: {"Authorization": `Bearer ${localStorage.getItem('csrfAccess')}`},
        })
            .then((response) => {
                return handleJsonResponseStatus(response, navigate);
            })
            .then((json) => {
                console.log('FETCH: Successful. Response JSON:', json);
                if (json !== undefined) {
                    setStudiosList(prevStudiosList => {
                        console.log('Setting studiosList to:', json);
                        return {
                            ...prevStudiosList,
                            ...json
                        }
                    });

                    // Set new studio coordinates
                    setStudiosCoords(() => {
                        let newStudiosCoords = [];
                        json.results.forEach((studio) => {
                            newStudiosCoords.push({
                                name: studio.name,
                                lat: studio.lat,
                                lng: studio.lng,
                            })
                        });
                        console.log('FETCH: Setting studiosCoords to:', newStudiosCoords);
                        return newStudiosCoords;
                    });

                    // Set new page params, only if next is different, since otherwise does infinite updates
                    if (json.next !== page_params.next) {
                        setPageParams((prevState) => {
                            console.log('FETCH: Setting page params to:', json.next);
                            return {
                                ...prevState,
                                next: json.next,
                            }
                        });
                    }

                    console.log('FETCH Finished SUCCESSFULLY\n' + '-'.repeat(50));
                } else {
                    console.log("FETCH: json was undefined");
                }
            })
            .catch((error) => {
                console.error('FETCH:', error);
            });
    }

    const nextPage = () => {
        wrappedConsoleLog('nextPage called');
        // Only go to next page if there exists a next page
        if (page_params.next !== null) {
            setPageParams(prevState => ({
                ...prevState,
                page: prevState.page + 1
            }));
        }
    }

    const prevPage = () => {
        wrappedConsoleLog('prevPage called');
        if (page_params.page > 1) {
            setPageParams(prevState => ({
                ...prevState,
                page: prevState.page - 1 // TODO: add max anyway?
            }));
        }
    }

    const handleParamChange = (param, value) => {
        /**
         * Updates the params state with the new value for the given param.
         *
         * This function is passed to the SearchParamField component, which calls it
         * when the user changes the value of a search field/parameter.
         *
         * Note that when SearchParamField calls handleParamChange, handleParamChange
         * has access to the params state and the setParams hook from its parent (this Studios component).
         *
         * QUESTION: is it better to do this:
         *  setParams({...params, [name]: value});
         */
        wrappedConsoleLog('handleParamChange called with param:', param, 'and value:', value);
        setParams(prevState => ({
            ...prevState,
            [param]: value
        }));

        // Set page params to their default values (they will get updated in the useEffect method)
        setPageParams({page: 1, next: null});
    }

    let studiosMap = document.querySelector('.studios-map');
    let mapWidth = studiosMap ? studiosMap.offsetWidth.toString() : '100%';
    const mapPadding = 20;

    return (
        <>
            <h1>Studio Search!</h1>
            <p>
                Search for studios near you. You can enter by desired studio name,
                any desired amenities or classes, or the name of your preferred fitness coach.
            </p>

            <div className="name-amenities" style={{float: 'left', marginRight: 20}}>
                <SearchParamField displayName='Studio Name' paramName='name' paramValue={params.name}
                                  onParamChange={handleParamChange}/>
                <SearchParamField displayName='Amenities' paramName='amenities' paramValue={params.amenities}
                                  onParamChange={handleParamChange}/>
            </div>
            <div className="class_names-coach">
                <SearchParamField displayName='Class Names' paramName='class_names' paramValue={params.class_names}
                                  onParamChange={handleParamChange}/>
                <SearchParamField displayName={'Coach'} paramName='coach' paramValue={params.coach}
                                  onParamChange={handleParamChange}/>
            </div>

            <h5 style={{marginTop: 30, marginBottom: 15}}>Page: {page_params.page}</h5>
            <div>
                <button onClick={prevPage} style={{marginRight: 5}}>Prev Page</button>
                <button onClick={nextPage}>Next Page</button>
            </div>

            {/* Note: Position relative and height value are required for FOOTER to work */}
            <div id='results-area'
                 style={{marginTop: 10,  position: "relative", overflowX: 'hidden'}}>
                <div id='studios-list' className='studios-list'
                      style={{float: "left", width: '50%', padding: mapPadding}}>
                    <StudiosList studiosList={studiosList}/>
                </div>
                <div id='studios-map' className='studios-map'
                     style={{float: "left", width: '50%', padding: mapPadding}}>
                    <StudiosMap
                        key={mapKey}
                        userCoords={userCoords}
                        studiosCoords={studiosCoords}
                        width={mapWidth}
                        padding={mapPadding}
                    />
                </div>
            </div>
            <div style={{height: 25}}></div>
        </>
    )
}

// TODO: Why is Studio comparison not working on first call? (debug django)
// TODO: Get amenities search to work
// TODO: token expires? ANSWER: extend token date. When TOKEN expires: please login again
// TODO: why is it not asking for location? Also, location is a bit weird. After I allowed, I had to reload - ok?

export default Studios;