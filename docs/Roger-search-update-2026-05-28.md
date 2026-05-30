Roger,

Quick update. Search is fixed and live on staging.

Searching "toto," "kohler," "brizo," or any other broad query no longer crashes the page. You see results or a clean loading state while results come in.

One honest caveat: on a stone-cold server (rare, since a keepalive runs every 3 minutes to keep it warm) a very broad single-word query can still take a few seconds on the back end. The page handles that gracefully so a customer sees a brief loading skeleton, never a crash. That last piece is a small future optimization, not urgent and not blocking launch.

Net: search works.

Josh
