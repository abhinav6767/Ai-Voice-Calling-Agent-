"""
check_inbound_sip.py  -- Diagnose inbound call busy issue
Run: python check_inbound_sip.py
"""
import asyncio, os, sys
import certifi

os.environ["SSL_CERT_FILE"] = certifi.where()
sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
load_dotenv(".env")

from livekit import api

URL    = os.getenv("LIVEKIT_URL")
KEY    = os.getenv("LIVEKIT_API_KEY")
SECRET = os.getenv("LIVEKIT_API_SECRET")
IN_TRUNK = os.getenv("INBOUND_TRUNK_ID")

SEP = "-" * 60

async def main():
    lk = api.LiveKitAPI(url=URL, api_key=KEY, api_secret=SECRET)
    print(SEP)
    print("  INBOUND BUSY DIAGNOSTIC")
    print(SEP)

    # 1. Inbound trunks
    print("\n[1] SIP INBOUND TRUNKS in LiveKit:")
    try:
        r = await lk.sip.list_sip_inbound_trunk(api.ListSIPInboundTrunkRequest())
        if not r.items:
            print("  [!!] NO inbound trunks -- calls have nowhere to land -> BUSY")
        for t in r.items:
            tag = "[env match]" if t.sid == IN_TRUNK else ""
            print(f"  Trunk SID : {t.sid}  {tag}")
            print(f"    Name    : {t.name}")
            print(f"    Numbers : {list(t.numbers)}")
            print(f"    Auth    : {t.auth_username or '(none)'}")
    except Exception as e:
        print(f"  ERROR: {e}")

    # 2. Dispatch rules
    print("\n[2] SIP DISPATCH RULES (need one targeting inbound-caller):")
    try:
        r = await lk.sip.list_sip_dispatch_rule(api.ListSIPDispatchRuleRequest())
        if not r.items:
            print("  [!!] NO dispatch rules found!")
            print("       --> Most common BUSY cause: LiveKit doesn't know where to route inbound calls.")
            print("       --> Fix: run  python create_inbound_dispatch_rule.py")
        for rule in r.items:
            print(f"  Rule SID  : {rule.sid}")
            print(f"    Name    : {rule.name}")
            print(f"    Trunks  : {list(rule.trunk_ids)}")
            if rule.rule:
                dd = getattr(rule.rule, "dispatch_rule_direct_dispatch", None)
                ip = getattr(rule.rule, "dispatch_rule_individual_participant", None)
                if dd:
                    print(f"    Type    : DirectDispatch  room_prefix={dd.room_prefix!r}  agent={dd.agent_name!r}")
                elif ip:
                    print(f"    Type    : IndividualParticipant  room_prefix={ip.room_prefix!r}")
                else:
                    print(f"    Type    : {rule.rule}")
    except Exception as e:
        print(f"  ERROR: {e}")

    # 3. Agent workers
    print("\n[3] ACTIVE AGENT WORKERS (inbound-caller must be listed):")
    try:
        r = await lk.agent.list_agent_workers(api.ListAgentWorkersRequest())
        if not r.items:
            print("  [!!] No workers connected at all -- run: python run.py dev")
        for w in r.items:
            tag = " <-- THIS ONE" if w.name == "inbound-caller" else ""
            print(f"  Worker: {w.name!r}  state={w.state}  id={w.id}{tag}")
    except Exception as e:
        print(f"  ERROR: {e}")

    print(f"\n{SEP}")
    print("  QUICK FIX GUIDE:")
    print("  A) No dispatch rule -> python create_inbound_dispatch_rule.py")
    print("  B) No 'inbound-caller' worker -> python run.py dev  (keep it running)")
    print("  C) Dispatch rule trunk mismatch -> update trunk_ids in the rule")
    print("  D) Vobiz inbound DID not pointed at LiveKit SIP URI -> fix in Vobiz portal")
    print(SEP)

    await lk.aclose()

asyncio.run(main())
