import { Outlet } from "react-router";
import { Dashboard, GroupIcon, Settings, Table } from "~/components/icons";

export default function LayoutV2() {
  return (
    <div className="bg-[#f2e5d7] h-screen flex flex-col">
      <div className="mt-12 mx-auto">
        <div className="flex space-between gap-5">
          <div>
            <Dashboard className="w-5" />
          </div>
          <div>
            <Table className="w-5" />
          </div>
          <div>
            <Settings className="w-5" />
          </div>
          <div>
            <GroupIcon className="w-5" />
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
