import Link from "next/link";
import { FaExclamationTriangle } from "react-icons/fa";

import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import Container from "./container";

export default function LoadingAndRetry({
  isLoading,
  isError,
  retry,
}: {
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
}) {
  return (
    <Container className="mt-12">
      {isLoading && <Spinner className="mx-auto h-24 w-24" />}

      {isError && (
        <div className="flex flex-col gap-3">
          <h2 className="flex items-center justify-center gap-2 uppercase">
            <FaExclamationTriangle /> error
          </h2>
          <div className="flex flex-col items-center justify-center gap-2">
            <p>An error has occurred</p>
            <div className="flex gap-4">
              <Button
                variant={"default"}
                size={"lg"}
                onClick={retry}
                className="text-xl"
              >
                Retry
              </Button>
              <Link href="/">
                <Button variant={"secondary"} size={"lg"}>
                  Go home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
