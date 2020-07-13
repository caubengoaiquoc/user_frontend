import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import LoadingBar from 'react-redux-loading-bar';
import MessengerCustomerChat from 'react-messenger-customer-chat';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import NoMatch from './pages/NoMatch';
import Home from './pages/Home';
import Filterdoctor from './pages/Filterdoctor';
import FilterService from './pages/FilterService';
import DetailDoctor from './pages/DetailDoctor';
import Dashboard from './pages/UserDashBoard'
import QA from './pages/QA';
import Booking from './pages/Booking';
import PrivateRoute from './routeConfig/PrivateRoute';
import AddressGoogleMap from './pages/AddressGoogleMap';

import './App.css';
import PackageDetail from './pages/PackageDetail';

const App = () => {

  return (
    <BrowserRouter>
      <LoadingBar showFastActions className="loading-bar" />
      <Switch >
        <Route exact path="/" render={(props) => <Home {...props} />} />
        <Route exact path="/login" render={(props) => <Login {...props} />} />
        <Route exact path="/register" component={Register} />
        <Route exact path="/password-recovery" component={ForgotPassword} />
        <Route exact path='/doctors' component={Filterdoctor} />
        <Route exact path='/service' component={FilterService} />
        <PrivateRoute exact path="/booking">
          <Booking />
        </PrivateRoute>
        <PrivateRoute exact path="/profile">
          <Dashboard />
        </PrivateRoute>
        <PrivateRoute exact path="/package/:id">
          <PackageDetail />
        </PrivateRoute>
        <PrivateRoute exact path="/map">
          <AddressGoogleMap />
        </PrivateRoute>
          
        <Route exact path='/qa' component={QA} />
        <Route exact path="/doctor/:id" render={(props) => <DetailDoctor {...props} />} />
        <Route path="*"><NoMatch /> </Route>
      </Switch>
      <MessengerCustomerChat
        pageId="585831004909513"
        appId="912333495590130"
        htmlRef={window.location.pathname}
      />
    </BrowserRouter>
  );
};

export default App;