

import { SuperVizRoomProvider } from "@superviz/react-sdk";
import { v4 as generateId } from "uuid";
import Room from "./Room";
import { ReactFlowProvider } from "reactflow";

const developerKey = "49lnmvunajwjn068ffx170xmkwg2s8";
const participantId = generateId();

export default function App() {
  return (
    <SuperVizRoomProvider
      developerKey={developerKey}
      group={{
        id: "react-flow-tutorial",
        name: "react-flow-tutorial",
      }}
      participant={{
        id: participantId,
        name: "Participant",
      }}
      roomId="react-flow-tutorial"
    >
      <ReactFlowProvider>
        <Room participantId={participantId} />
      </ReactFlowProvider>
    </SuperVizRoomProvider>
  );
}