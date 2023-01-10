import * as React from 'react';
import {useEffect, useContext} from 'react';
import {useNavigate} from 'react-router-dom';

import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import {createTheme, ThemeProvider} from '@mui/material/styles';

import UserContext from "../../contexts/userContext"

const theme = createTheme();

export default function Logout() {
    const {context, setContext} = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
        LogoutFetch();
        navigate("/");
    }, [])

    const handleSubmit = (event) => {
        event.preventDefault();
    };

    const LogoutFetch = () => {
        localStorage.setItem('csrfAccess', "");
        fetch(`http://localhost:8000/accounts/logout/`, {
            method: 'GET',
        })
            .then((response) => response.json())
            .then((json) => {
                setContext({id: "", activeSubscription: "", csrfAccess: "", csrfRefresh: ""});
                localStorage.setItem('id', "");
                localStorage.setItem('activeSubscription', "");
                console.log('Success:', json);
                // navigate("/profile");
            })
            .then(console.log(context.id))
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    return (
        <ThemeProvider theme={theme}>
            <Container component="main" maxWidth="xs">
                <CssBaseline/>
                <Box sx={{
                    marginTop: 2,
                    marginBottom: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}>
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{mt: 1}}>
                        <Typography>
                            Currently logged in as user {context.id}
                        </Typography>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{mt: 3, mb: 2}}
                        >
                            Log out
                        </Button>
                    </Box>
                </Box>
            </Container>
        </ThemeProvider>
    );
}