import React, {useEffect, useState, useContext} from 'react';
import {useNavigate} from 'react-router-dom';

import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import {createTheme, ThemeProvider} from '@mui/material/styles';

import UserContext from "../../contexts/userContext";

// From https://github.com/mui/material-ui/tree/v5.10.16/docs/data/material/getting-started/templates/sign-in

const theme = createTheme();

export default function Login() {
    const [usernameData, setUsernameData] = useState("");
    const [passwordData, setPasswordData] = useState("");
    const [feedback, setFeedback] = useState("");

    const {context, setContext} = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
        let accessToken = localStorage.getItem('csrfAccess');
        if (accessToken !== null && accessToken !== "") {
            // We want to redirect to profile. Shouldn't happen but just in case.
            navigate("/profile");
        }
        // const data = { username: usernameData, password: passwordData };
        const formData = new FormData();
        formData.append('username', usernameData);
        formData.append('password', passwordData);

        var res_status = doCSRF(formData, usernameData);
        if (res_status < 400) {
            setFeedback("Cannot find a user with those credentials.");
        }
    }, [usernameData, passwordData])

    const doCSRF = (formData, id) => {
        var res_status = 400;
        if (usernameData === "") {
            return; // We don't want to look here yet.
        }
        fetch(`http://localhost:8000/api/token/`, {
            method: 'POST',
            body: formData,
            // credentials: 'same-origin',
        })
        .then((res) => { // First extract headers...really just the CSRF token.
            console.log("This is the response", res);
            res_status = res.status;
            if (res.status >= 400) { 
                console.error("Error: Incorrect credentials or something");
                setFeedback("Cannot find a user with those credentials.");
            } 
            return res; 
        })
        .then(response => response.json())
        .then(json => {
            console.log("RES STATUS:", res_status);
            if (res_status < 400) {
                console.log("Sending to CSRF Function");
                console.log(json);
                setContext({...context,
                            csrfAccess: json.access, csrfRefresh: json.refresh});
                localStorage.setItem('csrfAccess', json.access);
                navigate("/profile");
            } else {
                setFeedback("Cannot find a user with those credentials.");
            }
        })
        .then(console.log(context))

        return res_status;
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        console.log({
            username: data.get('username'),
            password: data.get('password'),
            context: context,
        });
        setUsernameData(data.get('username'));
        setPasswordData(data.get('password'));
    };

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
                    <Avatar sx={{m: 1, bgcolor: 'secondary.main'}}>
                        <LockOutlinedIcon/>
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Log in
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{mt: 1}}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            autoComplete="username"
                            autoFocus
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{mt: 3, mb: 2}}
                        >
                            Sign In
                        </Button>
                        {feedback}
                    </Box>
                </Box>
            </Container>
        </ThemeProvider>
    );
}