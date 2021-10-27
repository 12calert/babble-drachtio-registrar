
const { v4: uuidv4 } = require( "uuid" )

/**
Represents a registration. Held by a user. Allowed multiple contact fields.
@class
*/
class reg {

  /**
  Instantiates the reg class.
  @constructor
  @param { Request } req - the incoming request
  @param { user } user - the user instance
  */
  constructor( req, user ) {

    this.uuid = uuidv4()
    this.initial = true

    this.network = {}
    this.network.source_address = req.source_address
    this.network.source_port = req.source_port
    this.network.protocol = req.protocol

    this.useragent = undefined === req.registrar.useragent ? "" : req.registrar.useragent
    this.allow = req.registrar.allow.toUpperCase().split( /[\s,]+/ )

    this.callid = req.get( "call-id" )

    this.contact = req.registration.contact
    this.aor = req.registration.aor
    this.expires = req.registration.expires

    this.user = user
    this.authorization = user.authorization
    this.options = user.options

    if ( undefined !== user.options.regping ) {
      this.expires = user.options.expires
    }
    this.registeredat = this._now()
    this.ping = this._now()

    if ( undefined !== user.options.optionsping ) {
      this.optionsintervaltimer = setInterval( this.pingoptions.bind( this ), user.options.optionsping * 1000 )
    }

    this.regexpiretimer = setTimeout( this.onexpire.bind( this ), this.expires * 1000 )
  }

  /**
  Whether the registration has expired.
  @type { boolean }
  */
  get expired() {
    return ( this.registeredat + this.expires ) < this._now()
  }

  /**
  Whether the registration is at least halfway to expiry.
  @type { boolean }
  */
  get expiring() {
    return ( this.registeredat + ( this.expires / 2 ) ) < this._now()
  }

  /**
  Gets the current time:
  - returns the current time in seconds
  @method
  */
  _now() {
    return Math.floor( +new Date() / 1000 )
  }

  /**
  Gets information on the registration:
  - populates an array with the URI property of each item on the contact property
  - returns an object containing the newly populated array of contact URIs, selected registration properties and an expiresat, an expiresin and a stale value generated using other properties
  @method
  */
  info() {
    const contacts = []
    this.contact.forEach( ( c ) => {
      contacts.push( c.uri )
    } )

    return {
      uuid: this.uuid,
      initial: this.initial,
      callid: this.callid,
      contacts,
      aor: this.aor,
      expires: this.expires,
      authorization: this.authorization,
      registeredat: this.registeredat,
      useragent: this.useragent,
      allow: this.allow,
      network: this.network,
      expiresat: this.registeredat + this.expires,
      expiresin: this.registeredat + this.expires - this._now(),
      stale: this.ping < ( this._now() - this.options.staletime )
    }
  }

  /**
  Extends the registration:
  - clears and resets the regexpiretimer timeout
  - sets the registeredat property to the current time in seconds
  - sets the initial property to false

  Called by the framework on further packets.
  @method
  */
  update() {
    clearTimeout( this.regexpiretimer )
    this.regexpiretimer = setTimeout( this.onexpire, this.expires * 1000, this )
    this.registeredat = this._now()
    this.initial = false
  }

  /**
  Records a ping:
  - sets the ping property to the return value of the _now method

  Called when a register is received, which is used in place of options ping.
  @method
  */
  regping() {
    this.ping = this._now()
  }

  /**
  Begins unregistration:
  - calls the user remove method for the registration
  @method
  */
  onexpire() {
    const ci = this.callid
    this.user.remove( ci )
  }

  /**
  Ends unregistration:
  - emits the unregister event with information on the registration
  - clears the optionsintervaltimer interval and regexpiretimer timeout
  @method
  */
  destroy() {
    this.options.em.emit( "unregister", this.info() )
    clearInterval( this.optionsintervaltimer )
    clearTimeout( this.regexpiretimer )
  }

  /**
  Sends an OPTIONS ping:
  - call the options SRF request method for each contact passing the contact URI, an options object and a callback, which calls the options.consolelog method for an error or records the ping
  @method
  */
  pingoptions() {

    const options = {
      method: "OPTIONS",
      headers: {
        Subject: "OPTIONS Ping"
      }
    }

    const handlerequest = ( err, req ) => {
      if ( err ) {
        this.options.consolelog( `Error sending OPTIONS: ${ err }` )
        return
      }
      req.on( "response", ( res ) => {
        if ( 200 == res.status ) {
          this.ping = this._now()
        }
      } )
    }

    this.contact.forEach( c => {
      this.options.srf.request( c.uri, options, handlerequest )
    } )
  }
}

module.exports = reg