import asyncio
import json
import websockets

async def test():
    async with websockets.connect('ws://localhost:8765') as ws:
        await ws.send(json.dumps({'action': 'inject_fault', 'machine_id': 'cnc-cutter-alpha', 'fault_type': 'bearing_failure'}))
        for _ in range(5):
            msg = await ws.recv()
            print('Received:', msg[:100])

asyncio.run(test())
