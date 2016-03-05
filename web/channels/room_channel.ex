defmodule Chat.RoomChannel do
  use Phoenix.Channel
  require Logger

  @doc """
  Authorize socket to subscribe and broadcast events on this channel & topic

  Possible Return Values

  `{:ok, socket}` to authorize subscription for channel for requested topic

  `:ignore` to deny subscription/broadcast on this channel
  for the requested topic
  """
  def join("rooms:lobby", message, socket) do
    Process.flag(:trap_exit, true)
    :timer.send_interval(5000, :ping)
    send(self, {:after_join, message})

    {:ok, socket}
  end

  def join("rooms:" <> _private_subtopic, _message, _socket) do
    {:error, %{reason: "unauthorized"}}
  end

  def handle_info({:after_join, msg}, socket) do
    broadcast! socket, "user:entered", %{user: msg["user"]}
    push socket, "join", %{status: "connected"}
    {:noreply, socket}
  end
  def handle_info(:ping, socket) do
    push socket, "new:msg", %{user: "SYSTEM", body: "ping"}
    {:noreply, socket}
  end

  def terminate(reason, _socket) do
    Logger.debug"> leave #{inspect reason}"
    :ok
  end

  def handle_in("new:msg", msg, socket) do
    broadcast! socket, "new:msg", %{user: msg["user"], body: msg["body"]}
    {:reply, {:ok, %{msg: msg["body"]}}, assign(socket, :user, msg["user"])}
  end

  def handle_in("new:bid", bid, socket) do
    handle_bid(socket, bid["user"], String.to_integer(bid["body"]))
  end

  def handle_bid(socket, user, amount) when amount > 3 do
    string_amount = Integer.to_string(amount)
    broadcast! socket, "new:bid", %{user: user, body: string_amount}
    {:reply, {:ok, %{msg: string_amount}}, assign(socket, :user, user)}
  end

  def handle_bid(socket, user, amount) do
    string_amount = Integer.to_string(amount)
    broadcast! socket, "new:msg", %{user: user, body: string_amount}
    {:reply, {:ok, %{msg: string_amount}}, assign(socket, :user, user)}
  end


  


end
