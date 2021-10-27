class Request {

  static defaultValues = {

    /*
      Request class
      cf. https://drachtio.org/api#sip-message
    */

    cancel: () => {},
    proxy: () => {},
    isNewInvite: true,

    /*
      SipMessage mix-in class, used by the Request and Response classes
      cf. https://drachtio.org/api#sip-message
    */

    get: function( header ) { return this.headers[ header ] },
    getParsedHeader: function( header ) { return { uri: this.headers[ header ] } },
    has: () => {},

    body: "some_body",
    calledNumber: "some_calledNumber",
    callingNumber: "some_callingNumber",
    headers: {},
    method: "REGISTER",
    payload: [],
    protocol: "some_protocol",
    reason: "some_reason",
    source: "some_source",
    source_address: "some_source_address",
    source_port: "some_source_port",
    stackTime: "some_stackTime",
    stackDialogId: "some_stackDialogId",
    stackTxnId: "some_stackTxnId",
    // status: 200, // Response only
    type: "request",
    uri: "", // Request only

    authorization: {
      realm: "some.realm",
      username: "1000"
    },
    registrar: {
      useragent: "some_useragent",
      allow: "some _,allow", // babble-drachtio-registrar reg class constructor splits on \s or ,
      contact: "expires=1",
      expires: 1
    },
    registration: {
      contact: [
        {
          uri: "some_uri",
          params: {
            methods: '\"some_value"' // punctuation intended, for testing of Registrar reg onauth callback
          }
        },
        {
          uri: "some_uri"
        }
      ],
      aor: "some_aor",
      expires: 1
    },
    headers: {
      "allow": "some_allow",
      "call-id": "some_call-id",
      "Contact": "expires=1",
      "To": "sip:1000@some.realm",
      "user-agent": "some_useragent"
    }
  }

  static values = { ...Request.defaultValues }

  constructor() {

    Object.keys( Request.values ).forEach( key => {
      this[ key ] = Request.values[ key ]
    })
  }

  static update = function( newValues, values = Request.values ) {

    const keys = Object.keys( values )

    for( let key in newValues ) {
      if( keys.includes( key ) ) {
        if( Object.prototype.toString.call( newValues[ key ] ).slice( 8, -1 ) === "Object" ) {
          values[ key ] = { ...Request.update( { ...newValues[ key ] }, { ...values[ key ] } ) }
          continue
        }
        values[ key ] = newValues[ key ]
      }
    }
    return values
  }

  static init = function( initialValues = {}, hasRegistrar = true ) {

    const resetValues = Request.update( Request.defaultValues )
    Request.values = Request.update( initialValues, resetValues )

    const r = new Request()

    if( !hasRegistrar ) delete r.registrar

    return r
  }
}

module.exports = Request