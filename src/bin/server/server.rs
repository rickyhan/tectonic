use crate::prelude::*;

use byteorder::{WriteBytesExt, NetworkEndian};

use std::borrow::{Borrow, Cow};
use std::cell::RefCell;
use std::collections::HashMap;
use std::net::SocketAddr;
use std::rc::Rc;
use std::str;
use std::sync::{Arc, RwLock};
use std::process::exit;

// #[cfg(unix)]
// fn enable_platform_hook(
//     handle: &Handle,
//     global: Global,
//     store: HashMapStore<'static>) {
//     let (subscriptions_tx, _) = mpsc::unbounded::<Update>();
//     let mut state = ThreadState::new(global, store, subscriptions_tx);

//     // Creates a listener for Unix signals that takes care of flushing all stores to file before
//     // shutting down the server.
//     // Catches `TERM` signals, which are sent by Kubernetes during graceful shutdown.
//     let signal_handler = tokio_signal::unix::Signal::new(15)
//         .flatten_stream()
//         .for_each(move |signal| {
//             println!("Signal: {}", signal);
//             info!("`TERM` signal recieved; flushing all stores...");
//             info!("All stores flushed; calling plugin exit hooks...");
//             run_plugin_exit_hooks(&state);
//             info!("Plugin exit hooks called; exiting...");
//             state.flushall();
//             exit(0);

//             #[allow(unreachable_code)]
//             Ok(())
//         })
//         .map_err(|err| error!("Error in signal handler future: {:?}", err));

//     handle.spawn(signal_handler);
// }

// #[cfg(windows)]
// fn enable_platform_hook<'a>(
//     handle: &Handle,
//     global: Global,
//     store: HashMapStore<'a>
// ) {
// }


fn spawn_and_log_error<F>(fut: F) -> task::JoinHandle<()>
where
    F: Future<Output = Result<()>> + Send + 'static,
{
    task::spawn(async move {
        if let Err(e) = fut.await {
            eprintln!("{}", e)
        }
    })
}

    // let listener = TcpListener::bind(&addr).await?;

    // let dtf_folder = &settings.dtf_folder;
    // utils::create_dir_if_not_exist(&dtf_folder);

    // info!("Listening on addr: {}", addr);
    // info!("----------------- initialized -----------------");

    // let (update_tx, update_rx) = mpsc::unbounded::<Update>();
    // let global = Arc::new(RwLock::new(SharedState::new(update_rx, settings.clone())));
    // let store = Arc::new(RwLock::new(HashMap::new()));

    // enable_platform_hook(&handle, Arc::clone(&global), Arc::clone(&store));

    // run_plugins(global.clone());

    // let mut incoming = listener.incoming();

    // // main loop
    // while let Some(stream) = incoming.next().await {
    //     // channel for pushing subscriptions directly from subscriptions thread
    //     // to client socket
    //     let (subscriptions_tx, subscriptions_rx) = mpsc::unbounded::<Update>();

    //     let global_copy = global.clone();
    //     let state = Rc::new(RefCell::new(
    //         ThreadState::new(Arc::clone(&global), Arc::clone(&store), subscriptions_tx.clone())
    //     ));
    //     let state_clone = state.clone();

    //     utils::init_dbs(&mut state.borrow_mut());
    //     on_connect(&global_copy);

    //     // map incoming subscription updates to the same format as regular
    //     // responses so they can be processed in the same manner.
    //     let subscriptions = subscriptions_rx.map(|message| (
    //         Cow::from(""), ReturnType::string(vec![message].as_json())
    //     ));

    //     let lines = lines(BufReader::new(&stream));
    //     let responses = lines.map(move |line| {
    //         let line: Cow<str> = line.into();
    //         let resp = handler::gen_response(line.borrow(), &mut state.borrow_mut());
    //         (line, resp)
    //     });

    //     // merge responses and messages pushed directly by subscriptions updates
    //     // into a single stream
    //     let merged = subscriptions.select(responses.map_err(|_| ()));

    //     let writes = merged.fold(wtr, |wtr, (line, resp)| {
    //         let mut buf: Vec<u8> = vec![];
    //         use self::ReturnType::*;
    //         match resp {
    //             Bytes(bytes) => {
    //                 buf.write_u8(0x1);
    //                 buf.write_u64::<NetworkEndian>(bytes.len() as u64);
    //                 buf.write(&bytes);
    //             }
    //             String(str_resp) => {
    //                 buf.write_u8(0x1);
    //                 buf.write_u64::<NetworkEndian>(str_resp.len() as u64);
    //                 buf.write(str_resp.as_bytes());
    //             }
    //             Error(errmsg) => {
    //                 error!("Req: `{}`", line);
    //                 error!("Err: `{}`", errmsg.clone());
    //                 buf.write_u8(0x0);
    //                 let ret = format!("ERR: {}\n", errmsg);
    //                 buf.write_u64::<NetworkEndian>(ret.len() as u64).unwrap();
    //                 buf.write(ret.as_bytes());
    //             }
    //         };
    //         wtr.write_all(buf).map(|(w, _)| w).map_err(|_| ())
    //     });

    //     let msg = writes.then(move |_| {
    //         state_clone.borrow_mut().unsub();
    //         on_disconnect(&global_copy);
    //         Ok(())
    //     });
    //     handle.spawn(msg);
    // }
    // Ok(())



async fn connection_loop(mut broker: Sender<Event>, stream: TcpStream) -> Result<()> {
    let stream = Arc::new(stream);
    let reader = BufReader::new(&*stream);
    let mut lines = reader.lines();

    let name = match lines.next().await {
        None => Err("peer disconnected immediately")?,
        Some(line) => line?,
    };
    let (_shutdown_sender, shutdown_receiver) = mpsc::unbounded::<Void>();
    broker
        .send(Event::NewPeer {
            name: name.clone(),
            stream: Arc::clone(&stream),
            shutdown: shutdown_receiver,
        })
        .await
        .unwrap();

    while let Some(line) = lines.next().await {
        let line = line?;
        // TODO: parse and send to broker
        broker
            .send(Event::Message { from: name.clone(), })
            .await
            .unwrap();
    }

    Ok(())
}

#[derive(Debug)]
enum Void {}

#[derive(Debug)]
enum Event {
    NewPeer {
        name: String,
        stream: Arc<TcpStream>,
        shutdown: Receiver<Void>,
    },
    Message {
        from: String,
    }
}


async fn broker_loop(mut events: Receiver<Event>) {
    let (disconnect_sender, mut disconnect_receiver) =
        mpsc::unbounded::<(String, Receiver<String>)>();
    let mut peers: HashMap<String, Sender<String>> = HashMap::new();

    loop {
        let event = select! {
            event = events.next().fuse() => match event {
                None => break,
                Some(event) => event,
            },
            disconnect = disconnect_receiver.next().fuse() => {
                let (name, _pending_messages) = disconnect.unwrap();
                assert!(peers.remove(&name).is_some());
                continue;
            },
        };
        match event {
            Event::Message { from } => {
                if let Some(peer) = peers.get_mut(&from) {
                    let msg = "hi".to_owned();
                    peer.send(msg).await.unwrap();
                }
            }
            Event::NewPeer {
                name,
                stream,
                shutdown,
            } => match peers.entry(name.clone()) {
                Entry::Occupied(..) => (),
                Entry::Vacant(entry) => {
                    let (client_sender, mut client_receiver) = mpsc::unbounded();
                    entry.insert(client_sender);
                    let mut disconnect_sender = disconnect_sender.clone();
                    spawn_and_log_error(async move {
                        let res =
                            connection_writer_loop(&mut client_receiver, stream, shutdown).await;
                        disconnect_sender
                            .send((name, client_receiver))
                            .await
                            .unwrap();
                        res
                    });
                }
            },
        }
    }
    drop(peers);
    drop(disconnect_sender);
    while let Some((_name, _pending_messages)) = disconnect_receiver.next().await {}
}

pub async fn run_server(host: &str, port: &str, settings: &Settings) -> Result<()> {
    let addr = format!("{}:{}", host, port);
    let addr: SocketAddr = addr.parse().expect("Invalid host or port provided!");

    info!("Trying to bind to addr: {}", addr);
    if !settings.autoflush {
        warn!("Autoflush is off!");
    }
    info!(
        "Autoflush is {}: every {} inserts.",
        settings.autoflush,
        settings.flush_interval
    );
    info!("History granularity: {}.", settings.hist_granularity);

    let listener = TcpListener::bind(addr).await?;

    let (broker_sender, broker_receiver) = mpsc::unbounded::<Event>();
    let broker = task::spawn(broker_loop(broker_receiver));
    let mut incoming = listener.incoming();
    while let Some(stream) = incoming.next().await {
        let stream = stream?;
        println!("Accepting from: {}", stream.peer_addr()?);
        spawn_and_log_error(connection_loop(broker_sender.clone(), stream));
    }
    drop(broker_sender);
    broker.await;
    Ok(())
}


async fn connection_writer_loop(
    messages: &mut Receiver<String>,
    stream: Arc<TcpStream>,
    mut shutdown: Receiver<Void>,
) -> Result<()> {
    let mut stream = &*stream;
    loop {
        select! {
            msg = messages.next().fuse() => match msg {
                Some(msg) => stream.write_all(msg.as_bytes()).await?,
                None => break,
            },
            void = shutdown.next().fuse() => match void {
                Some(void) => match void {},
                None => break,
            }
        }
    }
    Ok(())
}
