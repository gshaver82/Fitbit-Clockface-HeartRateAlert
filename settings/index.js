function mySettings(props) {
  return (
    <Page>
      <Section
        title={<Text bold align="center">Fitbit Account</Text>}>
        <Oauth
          settingsKey="oauth"
          title="Login"
          label="Fitbit -- Login here to load the fitbit user ID onto the watch. This is needed for watch alerts. After logging in here, you must log in on the website. This must be done due to the way the authentication refresh tokens work"
          status="Login"
          authorizeUrl="https://www.fitbit.com/oauth2/authorize"
          requestTokenUrl="https://api.fitbit.com/oauth2/token"
          clientId="23B56Z"
          clientSecret="9f4fda5a6cd220d712f5b3e835c805e4"
          scope="profile"
        />
      </Section> 
    <Select
      title={"Connection Buzz delay"}
      label={"How long the watch waits to buzz when the watch loses connection to the phone.  Will buzz for 10 seconds every 30 seconds. Watch will restart itself every 30 seconds until reconnection. Recommended 4+ min."}
      settingsKey="connBuzzDelay"
      options={[
        {name:"20 sec delay", value:"0"},
        {name:"One minute", value:"1"},
        {name:"Two minutes", value:"2"},
        {name:"Three minutes", value:"3"},
        {name:"Four minutes", value:"4"},
        {name:"Five minutes", value:"5"},
        {name:"Six minutes", value:"6"},
      ]}
    />
    <Select
      title={"Sync Buzz delay"}
      label={"When the watch should buzz after the last sync. Server will send sync alerts at 40 min. watch will buzz for 5 seconds and then stop, repeating every minute until synced"}
      settingsKey="syncBuzzDelay"
      options={[
        {name:"No buzz", value:"0"},
        {name:"30 minutes", value:"30"},
        {name:"36 minutes", value:"36"},
        {name:"38 minutes", value:"38"},
        {name:"39 minutes", value:"39"}
      ]}
    />
     <Toggle
        settingsKey="HRtoggle"
        label="20 second buzz when HR alert sent."
      />



    </Page>
  );
}

registerSettingsPage(mySettings);
// <Button  list  label="Clear Settings Storage"  onClick={() => props.settingsStorage.clear()}/>