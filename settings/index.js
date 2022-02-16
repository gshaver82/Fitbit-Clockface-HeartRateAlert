function mySettings(props) {
  return (
    <Page>
      <Section
        title={<Text bold align="center">Fitbit Account</Text>}>
        <Oauth
          settingsKey="oauth"
          title="Login"
          label="Fitbit"
          status="Login"
          authorizeUrl="https://www.fitbit.com/oauth2/authorize"
          requestTokenUrl="https://api.fitbit.com/oauth2/token"
          clientId="23B56Z"
          clientSecret="9f4fda5a6cd220d712f5b3e835c805e4"
          scope="profile"
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(mySettings);