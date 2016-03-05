import {Socket, LongPoller} from "phoenix"

class App {

  static init(){
    let socket = new Socket("/socket", {
      logger: ((kind, msg, data) => { console.log(`${kind}: ${msg}`, data) })
    })

    socket.connect({user_id: "123"}) //update with actual user ID
    var $status    = $("#status")
    var $messages  = $("#messages")
    var $input     = $("#message-input")
    var $username  = $("#username")
    var $bid       = $("#bid")
    var $current   = $("#current") //placeholder for current team.

    socket.onOpen( ev => console.log("OPEN", ev) )
    socket.onError( ev => console.log("ERROR", ev) )
    socket.onClose( e => console.log("CLOSE", e))

    var chan = socket.channel("rooms:lobby", {})
    chan.join().receive("ignore", () => console.log("auth error"))
               .receive("ok", () => console.log("join ok"))
               .after(10000, () => console.log("Connection interruption"))
    chan.onError(e => console.log("something went wrong", e))
    chan.onClose(e => console.log("channel closed", e))

    $input.off("keypress").on("keypress", e => {
      if (e.keyCode == 13) {
        chan.push("new:msg", {user: $username.val(), body: $input.val()})
        $input.val("")
      }
    })

    $bid.off("keypress").on("keypress", e => {
      if (e.keyCode == 13) {
        chan.push("new:bid", {user: $username.val(), body: $bid.val()})
        $bid.val("")
      }
    })

    chan.on("new:msg", msg => {
      $messages.append(this.messageTemplate(msg))
      scrollTo(0, document.body.scrollHeight)
    })

    chan.on("new:bid", bid => {
      $messages.append(this.bidTemplate(bid))
      scrollTo(0, document.body.scrollHeight)
    })

    chan.on("user:entered", msg => {
      var username = this.sanitize(msg.user || "bidder")
      $messages.append(`<br/><i>[${username} entered]</i>`)
    })
  }

  static sanitize(html){ return $("<div/>").text(html).html() }

  static messageTemplate(msg){
    let username = this.sanitize(msg.user || "anonymous")
    let body     = this.sanitize(msg.body)

    return(`<p><a href='#'>[${username}]</a>&nbsp; ${body}</p>`)
  }

  static bidTemplate(bid){
    let username = this.sanitize(bid.user || "anonymous")
    let body = this.sanitize(bid.body)

    return (`<p><a href='#'><b>${username} has bid ${body}</b></p>`)
  }

}

$( () => App.init() )

export default App
