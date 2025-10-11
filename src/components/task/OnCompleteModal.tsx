"use client";

import { type CompleteOptionType } from "@prisma/client";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { BsHeartPulseFill } from "react-icons/bs";
import { FaCalendarDay } from "react-icons/fa";
import { IoScaleOutline } from "react-icons/io5";
import { PiPersonBold } from "react-icons/pi";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const OnCompleteModal = ({
  completionType,
}: {
  completionType: CompleteOptionType;
}) => {
  // const onComplete: CompleteOptionType = "blood_pressure_reading";

  return (
    <Dialog open={true}>
      <DialogContent>
        {completionType === "Weigh_in" && <WeighIn />}
        {completionType === "Blood_pressure_reading" && (
          <BloodPressureReading />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OnCompleteModal;

const WeighIn = () => {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [weight, setWeight] = useState("");
  const [bodyFatPercentage, setBodyFatPercentage] = useState("");

  const utils = api.useUtils();
  // const { mutate: createWeighIn, isLoading: isCreatingWeighIn } =
  //   api.weighIns.create.useMutation({
  //     onSuccess: () => {
  //       void utils.weighIns.invalidate();
  //       completeAct({ id: event.id });
  //     },
  //   });

  const handleSaveWeighIn = () => {
    // createWeighIn({
    //   date,
    //   weight: parseFloat(weight),
    //   bodyFatPercentage: bodyFatPercentage
    //     ? parseFloat(bodyFatPercentage)
    //     : undefined,
    // });
  };

  return (
    <DialogContent className="flex w-fit flex-col gap-2">
      <DialogHeader>
        <DialogTitle>Weigh in</DialogTitle>
      </DialogHeader>
      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
        <PopoverTrigger asChild>
          <InputGroup className="w-fit">
            <InputGroupAddon>
              <FaCalendarDay />
            </InputGroupAddon>
            <Button variant="ghost">
              {date ? date.toLocaleDateString() : "Select date"}
              <ChevronDownIcon />
            </Button>
          </InputGroup>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => {
              setDate(date ?? new Date());
              setDatePickerOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      <InputGroup className="w-28">
        <InputGroupAddon>
          <IoScaleOutline />
        </InputGroupAddon>
        <InputGroupInput
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="180.2"
        />
        <InputGroupAddon align="inline-end">lbs</InputGroupAddon>
      </InputGroup>

      <InputGroup className="w-28">
        <InputGroupAddon>
          <PiPersonBold />
        </InputGroupAddon>
        <InputGroupInput
          value={bodyFatPercentage}
          onChange={(e) => setBodyFatPercentage(e.target.value)}
          placeholder="14.8"
        />
        <InputGroupAddon align="inline-end">%</InputGroupAddon>
      </InputGroup>
      <DialogFooter className="mt-8 flex flex-row">
        <Button variant={"secondary"}>Cancel</Button>
        <Button onClick={handleSaveWeighIn} disabled={!date || !weight}>
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

const BloodPressureReading = () => {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [heartRate, setHeartRate] = useState("");

  const utils = api.useUtils();
  // const { mutate: createWeighIn, isLoading: isCreatingWeighIn } =
  //   api.weighIns.create.useMutation({
  //     onSuccess: () => {
  //       void utils.weighIns.invalidate();
  //       completeAct({ id: event.id });
  //     },
  //   });

  const handleSaveBloodPressure = () => {
    // createWeighIn({
    //   date,
    //   weight: parseFloat(weight),
    //   bodyFatPercentage: bodyFatPercentage
    //     ? parseFloat(bodyFatPercentage)
    //     : undefined,
    // });
  };

  return (
    <DialogContent className="flex w-fit flex-col gap-2">
      <DialogHeader>
        <DialogTitle>Blood Pressure Reading</DialogTitle>
      </DialogHeader>
      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
        <PopoverTrigger asChild>
          <InputGroup className="w-fit">
            <InputGroupAddon>
              <FaCalendarDay />
            </InputGroupAddon>
            <Button variant="ghost">
              {date ? date.toLocaleDateString() : "Select date"}
              <ChevronDownIcon />
            </Button>
          </InputGroup>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => {
              setDate(date ?? new Date());
              setDatePickerOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      <div>
        <InputGroup className="w-32">
          <InputGroupAddon>
            <AiFillHeart />
          </InputGroupAddon>
          <InputGroupInput
            value={systolic}
            onChange={(e) => setSystolic(e.target.value)}
            placeholder="120"
          />
          <InputGroupAddon align="inline-end">mmHg</InputGroupAddon>
        </InputGroup>
        <span className="text-muted-foreground text-sm">Systolic</span>
      </div>

      <div>
        <InputGroup className="w-32">
          <InputGroupAddon>
            <AiOutlineHeart />
          </InputGroupAddon>
          <InputGroupInput
            value={diastolic}
            onChange={(e) => setDiastolic(e.target.value)}
            placeholder="80"
          />
          <InputGroupAddon align="inline-end">mmHg</InputGroupAddon>
        </InputGroup>
        <span className="text-muted-foreground text-sm">Diastolic</span>
      </div>

      <InputGroup className="w-28">
        <InputGroupAddon>
          <BsHeartPulseFill />
        </InputGroupAddon>
        <InputGroupInput
          value={heartRate}
          onChange={(e) => setHeartRate(e.target.value)}
          placeholder="70"
        />
        <InputGroupAddon align="inline-end">bpm</InputGroupAddon>
      </InputGroup>
      <DialogFooter className="mt-8 flex flex-row">
        <Button variant={"secondary"}>Cancel</Button>
        <Button
          onClick={handleSaveBloodPressure}
          disabled={!date || !systolic || !diastolic}
        >
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
