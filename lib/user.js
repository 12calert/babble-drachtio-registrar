
const reg = require( "./reg.js" )

/**
Represents a user. Held by a domain. Stores and handles a map of user registrations.
@class
*/
class user {

  /**
  Instantiates the user class.
  @constructor
  @param { object } authorization - the incoming request authorization object
  @param { object } options - the Registrar instance options object
  */
  constructor( authorization, options ) {

    this.registrations = new Map()
    this.authorization = authorization
    this.options = options
  }

  /**
  Handles registration:
  - adds and returns a registration by call ID if not present, or returns if expired
  - else calls the remove method for a registration and returns
  - else gets a registration, calls reg.update, logs via the options.consolelog method and returns it
  @method
  @param { Request } req - the incoming request
  */
  reg( req ) {

    const ci = req.get( "call-id" )

    if ( !this.registrations.has( ci ) ) {
      if ( 0 === req.registrar.expires ) return

      // Add new registration
      const r = new reg( req, this )
      this.registrations.set( ci, r )
      return r
    }

    // Remove registration
    if ( 0 === req.registrar.expires ) {
      this.remove( ci )
      return
    }

    // Update registration
    const r = this.registrations.get( ci )
    r.update()
    this.options.consolelog( `${this.registrations.size} registration(s) for user ${this.authorization.username}` )
    return r
  }

  /**
  Removes a registration:
  - calls reg.destroy for a registration found by call ID then deletes it
  @method
  @param { string } ci - the registration call ID
  */
  remove( ci ) {
    this.registrations.get( ci ).destroy()
    this.registrations.delete( ci )
  }
}

module.exports = user