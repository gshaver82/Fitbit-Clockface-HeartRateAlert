

function mySettings(props) {
  return (
    <Page>
      <Section
        title={<Text bold align="center">Watch Account Pairing</Text>}
      >
        <Text>
          To connect this watch to your account, log in to the
          Cryonics Member Response website and generate a watch
          pairing code.
        </Text>

        <TextInput
          settingsKey="pairingCode"
          title="Watch Pairing Code"
          label="Enter the pairing code from your account on the website. This identifies which account should receive emergency alerts from this watch."
          pairingCode="Enter pairing code"
        />
      </Section>

      <Select
        title={"Connection Buzz delay"}
        label={"How long the watch waits to buzz when the watch loses connection to the phone. Will buzz for 10 seconds every 30 seconds. Watch will restart itself every 30 seconds until reconnection. Recommended 4+ min."}
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

      <Toggle
        settingsKey="HRtoggle"
        label="20 second buzz when HR alert sent."
      />
    </Page>
  );
}

registerSettingsPage(mySettings);
